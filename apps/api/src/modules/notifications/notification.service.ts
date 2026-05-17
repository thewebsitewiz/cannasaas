import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import {
  NotificationTemplate,
  NotificationLog,
} from './entities/notification.entity';
import { CircuitBreaker } from '../../common/services/circuit-breaker';

// ── Twilio shape (avoid pulling the full SDK type surface) ────────────────

interface TwilioMessage {
  sid: string;
}

interface TwilioMessages {
  create(opts: {
    body: string;
    from: string;
    to: string;
  }): Promise<TwilioMessage>;
}

interface TwilioClient {
  messages: TwilioMessages;
}

type TwilioFactory = (sid: string, token: string) => TwilioClient;

// ── DB row types ──────────────────────────────────────────────────────────

interface CustomerRow {
  email: string;
  firstName: string | null;
  phone: string | null;
  email_order_updates: boolean | null;
  sms_order_updates: boolean | null;
  sms_opt_in: boolean | null;
  marketing_opt_in: boolean | null;
}

interface DispensaryAddressRow {
  name: string;
  address: string;
}

interface DispensaryNameRow {
  name: string;
}

interface NotificationStatsRow {
  total: string | number;
  sent: string | number;
  failed: string | number;
  skipped: string | number;
  emails: string | number;
  sms: string | number;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface NotificationStatsDto {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  emails: number;
  sms: number;
}

export interface OrderEventPayload {
  orderId?: string;
  dispensaryId: string;
  customerUserId?: string | null;
  status?: string;
  total?: number | null;
  orderType?: string | null;
}

export interface CustomerRegisteredPayload {
  userId: string;
  email: string;
  firstName?: string;
  dispensaryId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransport: nodemailer.Transporter;
  private twilioClient: TwilioClient | null = null;
  private twilioPhone: string;
  private readonly emailBreaker = new CircuitBreaker({
    name: 'email-smtp',
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  });
  private readonly smsBreaker = new CircuitBreaker({
    name: 'sms-twilio',
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  });

  constructor(
    @InjectRepository(NotificationTemplate)
    private templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(NotificationLog)
    private logRepo: Repository<NotificationLog>,
    @InjectDataSource() private ds: DataSource,
    private config: ConfigService,
  ) {
    const smtpHost = this.config.get<string>('SMTP_HOST', 'smtp.sendgrid.net');
    const smtpPort = this.config.get<number>('SMTP_PORT', 587);
    const smtpUser = this.config.get<string>('SMTP_USER', 'apikey');
    const smtpPass = this.config.get<string>('SMTP_PASS', '');

    this.emailTransport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    const twilioSid = this.config.get<string>('TWILIO_SID', '');
    const twilioToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.twilioPhone = this.config.get<string>('TWILIO_PHONE', '');

    if (twilioSid && twilioToken) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const twilio = require('twilio') as TwilioFactory;
        this.twilioClient = twilio(twilioSid, twilioToken);
      } catch {
        this.logger.warn('Twilio SDK not available — SMS disabled');
      }
    }
  }

  // ── Template Rendering ────────────────────────────────────────────────────

  private renderTemplate(
    template: string,
    vars: Record<string, unknown>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      let rendered: string;
      if (value == null) rendered = '';
      else if (typeof value === 'string') rendered = value;
      else if (typeof value === 'number' || typeof value === 'boolean')
        rendered = String(value);
      else rendered = JSON.stringify(value);
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), rendered);
    }
    result = result.replace(
      /{{#if (\w+)}}([\s\S]*?){{\/if}}/g,
      (_, varName: string, content: string) => {
        return vars[varName] ? content : '';
      },
    );
    result = result.replace(
      /{{#if (\w+) "([^"]+)"}}([\s\S]*?){{(?:else}}([\s\S]*?))?{{\/if}}/g,
      (
        _,
        varName: string,
        expected: string,
        ifContent: string,
        elseContent: string,
      ) => {
        return vars[varName] === expected ? ifContent : elseContent || '';
      },
    );
    return result.trim();
  }

  // ── Send Email ────────────────────────────────────────────────────────────

  async sendEmail(input: {
    to: string;
    subject: string;
    body: string;
    userId?: string;
    dispensaryId?: string;
    templateCode?: string;
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
      const fromEmail = this.config.get<string>(
        'EMAIL_FROM',
        'noreply@cannasaas.com',
      );
      const fromName = this.config.get<string>('EMAIL_FROM_NAME', 'CannaSaas');

      const info = (await this.emailBreaker.exec(() =>
        this.emailTransport.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: input.to,
          subject: input.subject,
          text: input.body,
          html: input.body.replace(/\n/g, '<br>'),
        }),
      )) as { messageId: string };

      log.status = 'sent';
      log.external_id = info.messageId;
      log.sent_at = new Date();
      this.logger.log(`Email sent: ${input.to} — ${input.subject}`);
    } catch (err: unknown) {
      const msg = errorMessage(err);
      log.status = 'failed';
      log.error_message = msg;
      this.logger.error(`Email failed: ${input.to} — ${msg}`);
    }

    return this.logRepo.save(log);
  }

  // ── Send SMS ──────────────────────────────────────────────────────────────

  async sendSms(input: {
    to: string;
    body: string;
    userId?: string;
    dispensaryId?: string;
    templateCode?: string;
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
      const client = this.twilioClient;
      const message = await this.smsBreaker.exec(() =>
        client.messages.create({
          body: input.body,
          from: this.twilioPhone,
          to: input.to,
        }),
      );

      log.status = 'sent';
      log.external_id = message.sid;
      log.sent_at = new Date();
      this.logger.log(`SMS sent: ${input.to}`);
    } catch (err: unknown) {
      const msg = errorMessage(err);
      log.status = 'failed';
      log.error_message = msg;
      this.logger.error(`SMS failed: ${input.to} — ${msg}`);
    }

    return this.logRepo.save(log);
  }

  // ── Send by Template ──────────────────────────────────────────────────────

  async sendByTemplate(
    templateCode: string,
    vars: Record<string, unknown>,
    recipient: {
      email?: string;
      phone?: string;
      userId?: string;
      dispensaryId?: string;
    },
  ): Promise<NotificationLog[]> {
    const template = await this.templateRepo.findOne({
      where: { code: templateCode, is_active: true },
    });
    if (!template) {
      this.logger.warn(`Template not found: ${templateCode}`);
      return [];
    }

    const logs: NotificationLog[] = [];
    const body = this.renderTemplate(template.body_template, vars);

    if (template.channel === 'email' && recipient.email) {
      const subject = template.subject
        ? this.renderTemplate(template.subject, vars)
        : 'Notification';
      logs.push(
        await this.sendEmail({
          to: recipient.email,
          subject,
          body,
          userId: recipient.userId,
          dispensaryId: recipient.dispensaryId,
          templateCode,
        }),
      );
    }

    if (template.channel === 'sms' && recipient.phone) {
      logs.push(
        await this.sendSms({
          to: recipient.phone,
          body,
          userId: recipient.userId,
          dispensaryId: recipient.dispensaryId,
          templateCode,
        }),
      );
    }

    return logs;
  }

  // ── Notify Customer (both channels based on prefs) ────────────────────────

  async notifyCustomer(
    userId: string,
    eventCode: string,
    vars: Record<string, unknown>,
  ): Promise<NotificationLog[]> {
    const customers = await rawQuery<CustomerRow>(
      this.ds,
      `SELECT u.email, u."firstName", u.phone, cp.email_order_updates, cp.sms_order_updates,
        cp.sms_opt_in, cp.marketing_opt_in
       FROM users u LEFT JOIN customer_profiles cp ON cp.user_id = u.id WHERE u.id = $1`,
      [userId],
    );
    const customer = customers[0];
    if (!customer) return [];

    const dispensaryId = vars.dispensaryId as string | undefined;
    const enrichedVars: Record<string, unknown> = {
      ...vars,
      firstName: vars.firstName ?? customer.firstName ?? 'Customer',
    };
    const logs: NotificationLog[] = [];

    if (customer.email_order_updates !== false) {
      const emailLogs = await this.sendByTemplate(eventCode, enrichedVars, {
        email: customer.email,
        userId,
        dispensaryId,
      });
      logs.push(...emailLogs);
    }

    if (customer.sms_order_updates && customer.phone) {
      const smsCode = eventCode + '_sms';
      const smsLogs = await this.sendByTemplate(smsCode, enrichedVars, {
        phone: customer.phone,
        userId,
        dispensaryId,
      });
      logs.push(...smsLogs);
    }

    return logs;
  }

  // ── Event Listeners ───────────────────────────────────────────────────────

  @OnEvent('order.created')
  async onOrderCreated(payload: OrderEventPayload): Promise<void> {
    if (payload.orderType === 'in_store') return;
    if (!payload.customerUserId) return;

    const dispRows = await rawQuery<DispensaryAddressRow>(
      this.ds,
      `SELECT name, address_line1 || ', ' || city || ' ' || state || ' ' || zip as address FROM dispensaries WHERE entity_id = $1`,
      [payload.dispensaryId],
    );
    const disp = dispRows[0];

    await this.notifyCustomer(payload.customerUserId, 'order_created', {
      orderNumber: payload.orderId?.slice(0, 8).toUpperCase(),
      dispensaryName: disp?.name ?? 'Your Dispensary',
      dispensaryAddress: disp?.address ?? '',
      total: payload.total?.toFixed(2),
      orderType: payload.orderType ?? 'pickup',
      dispensaryId: payload.dispensaryId,
    });
  }

  @OnEvent('order.completed')
  async onOrderCompleted(payload: OrderEventPayload): Promise<void> {
    if (payload.orderType === 'in_store') return;
    if (!payload.customerUserId) return;
    const dispRows = await rawQuery<DispensaryAddressRow>(
      this.ds,
      `SELECT name, address_line1 || ', ' || city || ' ' || state || ' ' || zip as address FROM dispensaries WHERE entity_id = $1`,
      [payload.dispensaryId],
    );
    const disp = dispRows[0];
    await this.notifyCustomer(payload.customerUserId, 'order_confirmed', {
      orderNumber: payload.orderId?.slice(0, 8).toUpperCase(),
      dispensaryName: disp?.name ?? 'Your Dispensary',
      dispensaryAddress: disp?.address ?? '',
      total: payload.total?.toFixed(2),
      orderType: payload.orderType ?? 'pickup',
      dispensaryId: payload.dispensaryId,
    });
  }

  @OnEvent('order.status_changed')
  async onOrderStatusChanged(payload: {
    orderId: string;
    dispensaryId: string;
    customerUserId?: string | null;
    status: string;
    total?: number | null;
    orderType?: string | null;
  }): Promise<void> {
    if (payload.orderType === 'in_store') return;
    if (!payload.customerUserId) return;

    const statusTemplateMap: Record<string, string> = {
      confirmed: 'order_confirmed',
      preparing: 'order_preparing',
      ready: 'order_ready',
      ready_for_pickup: 'order_ready',
      out_for_delivery: 'order_out_for_delivery',
      delivered: 'order_delivered',
      picked_up: 'order_delivered',
      completed: 'order_completed',
      cancelled: 'order_cancelled',
    };

    const templateCode = statusTemplateMap[payload.status];
    if (!templateCode) return;

    const dispRows = await rawQuery<DispensaryAddressRow>(
      this.ds,
      `SELECT name, address_line1 || ', ' || city || ' ' || state || ' ' || zip as address FROM dispensaries WHERE entity_id = $1`,
      [payload.dispensaryId],
    );
    const disp = dispRows[0];

    await this.notifyCustomer(payload.customerUserId, templateCode, {
      orderNumber: payload.orderId.slice(0, 8).toUpperCase(),
      dispensaryName: disp?.name ?? 'Your Dispensary',
      dispensaryAddress: disp?.address ?? '',
      total: payload.total?.toFixed(2),
      orderType: payload.orderType ?? 'pickup',
      dispensaryId: payload.dispensaryId,
    });
  }

  @OnEvent('customer.registered')
  async onCustomerRegistered(
    payload: CustomerRegisteredPayload,
  ): Promise<void> {
    let dispensaryName = 'CannaSaas';
    if (payload.dispensaryId) {
      const dispRows = await rawQuery<DispensaryNameRow>(
        this.ds,
        `SELECT name FROM dispensaries WHERE entity_id = $1`,
        [payload.dispensaryId],
      );
      dispensaryName = dispRows[0]?.name ?? 'CannaSaas';
    }

    await this.sendByTemplate(
      'welcome',
      {
        firstName: payload.firstName ?? 'there',
        dispensaryName,
      },
      {
        email: payload.email,
        userId: payload.userId,
        dispensaryId: payload.dispensaryId,
      },
    );
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async getNotificationLog(
    userId: string,
    limit = 20,
  ): Promise<NotificationLog[]> {
    return this.logRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({ order: { code: 'ASC' } });
  }

  async getDispensaryNotificationStats(
    dispensaryId: string,
    days = 30,
  ): Promise<NotificationStatsDto> {
    const rows = await rawQuery<NotificationStatsRow>(
      this.ds,
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
    const stats = rows[0];
    return {
      total: toInt(stats.total),
      sent: toInt(stats.sent),
      failed: toInt(stats.failed),
      skipped: toInt(stats.skipped),
      emails: toInt(stats.emails),
      sms: toInt(stats.sms),
    };
  }
}
