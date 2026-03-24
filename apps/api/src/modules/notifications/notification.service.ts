import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { CircuitBreaker } from '../../common/services/circuit-breaker';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransport: nodemailer.Transporter;
  private twilioClient: any;
  private twilioPhone: string;
  private readonly emailBreaker = new CircuitBreaker({ name: 'email-smtp', failureThreshold: 5, resetTimeoutMs: 30000 });
  private readonly smsBreaker = new CircuitBreaker({ name: 'sms-twilio', failureThreshold: 5, resetTimeoutMs: 30000 });

  constructor(
    @Inject(DRIZZLE) private db: any,
    private config: ConfigService
  ) {
    // Email setup — uses SMTP or SendGrid
    const smtpHost = this.config.get<string>('SMTP_HOST', 'smtp.sendgrid.net');
    const smtpPort = this.config.get<number>('SMTP_PORT', 587);
    const smtpUser = this.config.get<string>('SMTP_USER', 'apikey');
    const smtpPass = this.config.get<string>('SMTP_PASS', '');

    this.emailTransport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    // Twilio setup
    const twilioSid = this.config.get<string>('TWILIO_SID', '');
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.twilioPhone = this.config.get<string>('TWILIO_PHONE', '');

    if (twilioSid && twilioToken) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(twilioSid, twilioToken);
      } catch (e) {
        this.logger.warn('Twilio SDK not available — SMS disabled');
      }
    }
  }

  // ── Template Rendering ────────────────────────────────────────────────────

  private renderTemplate(template: string, vars: Record<string, any>): string {
    let result = template;
    // Simple {{var}} replacement
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value ?? '');
    }
    // Simple {{#if var}}...{{/if}} blocks
    result = result.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, varName, content) => {
      return vars[varName] ? content : '';
    });
    // {{#if var "value"}}...{{/if}} equality check
    result = result.replace(/{{#if (\w+) "([^"]+)"}}([\s\S]*?){{(?:else}}([\s\S]*?))?{{\/if}}/g, (_, varName, expected, ifContent, elseContent) => {
      return vars[varName] === expected ? ifContent : (elseContent || '');
    });
    return result.trim();
  }

  // ── Send Email ────────────────────────────────────────────────────────────

  async sendEmail(input: {
    to: string; subject: string; body: string;
    userId?: string; dispensaryId?: string; templateCode?: string;
  }): Promise<NotificationLog> {
    const log = this.logRepo.create({
      user_id: input.userId,
      dispensary_id: input.dispensaryId,
      channel: 'email',
      template_code: input.templateCode,
      recipient: input.to,
      subject: input.subject,
      body: input.body,
      status: 'pending',
    });

    try {
      const fromEmail = this.config.get<string>('EMAIL_FROM', 'noreply@cannasaas.com');
      const fromName = this.config.get<string>('EMAIL_FROM_NAME', 'CannaSaas');

      const info = await this.emailBreaker.exec(() =>
        this.emailTransport.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: input.to,
          subject: input.subject,
          text: input.body,
          html: input.body.replace(/\n/g, '<br>'),
        }),
      );

      log.status = 'sent';
      log.external_id = info.messageId;
      log.sent_at = new Date();
      this.logger.log(`Email sent: ${input.to} — ${input.subject}`);
    } catch (err: any) {
      log.status = 'failed';
      log.error_message = err.message;
      this.logger.error(`Email failed: ${input.to} — ${err.message}`);
    }

    return this.logRepo.save(log);
  }

  // ── Send SMS ──────────────────────────────────────────────────────────────

  async sendSms(input: {
    to: string; body: string;
    userId?: string; dispensaryId?: string; templateCode?: string;
  }): Promise<NotificationLog> {
    const log = this.logRepo.create({
      user_id: input.userId,
      dispensary_id: input.dispensaryId,
      channel: 'sms',
      template_code: input.templateCode,
      recipient: input.to,
      body: input.body,
      status: 'pending',
    });

    if (!this.twilioClient) {
      log.status = 'skipped';
      log.error_message = 'Twilio not configured';
      this.logger.warn(`SMS skipped (no Twilio): ${input.to}`);
      return this.logRepo.save(log);
    }

    try {
      const message = await this.smsBreaker.exec(() =>
        this.twilioClient.messages.create({
          body: input.body,
          from: this.twilioPhone,
          to: input.to,
        }),
      );

      log.status = 'sent';
      log.external_id = (message as any).sid;
      log.sent_at = new Date();
      this.logger.log(`SMS sent: ${input.to}`);
    } catch (err: any) {
      log.status = 'failed';
      log.error_message = err.message;
      this.logger.error(`SMS failed: ${input.to} — ${err.message}`);
    }

    return this.logRepo.save(log);
  }

  // ── Send by Template ──────────────────────────────────────────────────────

  async sendByTemplate(templateCode: string, vars: Record<string, any>, recipient: { email?: string; phone?: string; userId?: string; dispensaryId?: string }): Promise<NotificationLog[]> {
    const template = await this.templateRepo.findOne({ where: { code: templateCode, is_active: true } });
    if (!template) {
      this.logger.warn(`Template not found: ${templateCode}`);
      return [];
    }

    const logs: NotificationLog[] = [];
    const body = this.renderTemplate(template.body_template, vars);

    if (template.channel === 'email' && recipient.email) {
      const subject = template.subject ? this.renderTemplate(template.subject, vars) : 'Notification';
      logs.push(await this.sendEmail({ to: recipient.email, subject, body, userId: recipient.userId, dispensaryId: recipient.dispensaryId, templateCode }));
    }

    if (template.channel === 'sms' && recipient.phone) {
      logs.push(await this.sendSms({ to: recipient.phone, body, userId: recipient.userId, dispensaryId: recipient.dispensaryId, templateCode }));
    }

    return logs;
  }

  // ── Notify Customer (both channels based on prefs) ────────────────────────

  async notifyCustomer(userId: string, eventCode: string, vars: Record<string, any>): Promise<NotificationLog[]> {
    const [customer] = await this._q(
      `SELECT u.email, u."firstName", u.phone, cp.email_order_updates, cp.sms_order_updates,
        cp.sms_opt_in, cp.marketing_opt_in
       FROM users u LEFT JOIN customer_profiles cp ON cp.user_id = u.id WHERE u.id = $1`,
      [userId],
    );
    if (!customer) return [];

    vars.firstName = vars.firstName || customer.firstName || 'Customer';
    const logs: NotificationLog[] = [];

    // Email
    if (customer.email_order_updates !== false) {
      const emailLogs = await this.sendByTemplate(eventCode, vars, {
        email: customer.email, userId, dispensaryId: vars.dispensaryId,
      });
      logs.push(...emailLogs);
    }

    // SMS
    if (customer.sms_order_updates && customer.phone) {
      const smsCode = eventCode + '_sms';
      const smsLogs = await this.sendByTemplate(smsCode, vars, {
        phone: customer.phone, userId, dispensaryId: vars.dispensaryId,
      });
      logs.push(...smsLogs);
    }

    return logs;
  }

  // ── Event Listeners ───────────────────────────────────────────────────────

  @OnEvent('order.completed')
  async onOrderCompleted(payload: any): Promise<void> {
    if (!payload.customerUserId) return;
    const [disp] = await this._q(
      `SELECT name, address_line1 || ', ' || city || ' ' || state || ' ' || zip as address FROM dispensaries WHERE entity_id = $1`,
      [payload.dispensaryId],
    );
    await this.notifyCustomer(payload.customerUserId, 'order_confirmed', {
      orderNumber: payload.orderId?.slice(0, 8).toUpperCase(),
      dispensaryName: disp?.name || 'Your Dispensary',
      dispensaryAddress: disp?.address || '',
      total: payload.total?.toFixed(2),
      orderType: payload.orderType || 'pickup',
      dispensaryId: payload.dispensaryId,
    });
  }

  @OnEvent('order.status_changed')
  async onOrderStatusChanged(payload: { orderId: string; dispensaryId: string; customerUserId?: string; status: string; total?: number; orderType?: string }): Promise<void> {
    if (!payload.customerUserId) return;

    const statusTemplateMap: Record<string, string> = {
      preparing: 'order_preparing',
      ready_for_pickup: 'order_ready',
      out_for_delivery: 'order_out_for_delivery',
      delivered: 'order_delivered',
      picked_up: 'order_delivered',
      cancelled: 'order_cancelled',
    };

    const templateCode = statusTemplateMap[payload.status];
    if (!templateCode) return;

    const [disp] = await this._q(
      `SELECT name, address_line1 || ', ' || city || ' ' || state || ' ' || zip as address FROM dispensaries WHERE entity_id = $1`,
      [payload.dispensaryId],
    );

    await this.notifyCustomer(payload.customerUserId, templateCode, {
      orderNumber: payload.orderId.slice(0, 8).toUpperCase(),
      dispensaryName: disp?.name || 'Your Dispensary',
      dispensaryAddress: disp?.address || '',
      total: payload.total?.toFixed(2),
      orderType: payload.orderType || 'pickup',
      dispensaryId: payload.dispensaryId,
    });
  }

  @OnEvent('customer.registered')
  async onCustomerRegistered(payload: { userId: string; email: string; firstName?: string; dispensaryId?: string }): Promise<void> {
    const [disp] = payload.dispensaryId
      ? await this._q(`SELECT name FROM dispensaries WHERE entity_id = $1`, [payload.dispensaryId])
      : [{ name: 'CannaSaas' }];

    await this.sendByTemplate('welcome', {
      firstName: payload.firstName || 'there',
      dispensaryName: disp?.name || 'CannaSaas',
    }, { email: payload.email, userId: payload.userId, dispensaryId: payload.dispensaryId });
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async getNotificationLog(userId: string, limit = 20): Promise<NotificationLog[]> {
    return this.logRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({ order: { code: 'ASC' } });
  }

  async getDispensaryNotificationStats(dispensaryId: string, days = 30): Promise<any> {
    const [stats] = await this._q(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) FILTER (WHERE channel = 'email') as emails,
        COUNT(*) FILTER (WHERE channel = 'sms') as sms
       FROM notification_log WHERE dispensary_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2`,
      [dispensaryId, days],
    );
    return {
      total: parseInt(stats.total), sent: parseInt(stats.sent),
      failed: parseInt(stats.failed), skipped: parseInt(stats.skipped),
      emails: parseInt(stats.emails), sms: parseInt(stats.sms),
    };
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
