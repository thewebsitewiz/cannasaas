import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendBetaInvitation(data: { to: string; name: string; code: string }) {
    this.logger.log(`[STUB] Beta invitation to ${data.to} code ${data.code}`);
  }

  async sendStaffInvitation(data: { to: string; orgName: string; orgId: string; role?: string }) {
    this.logger.log(`[STUB] Staff invitation to ${data.to} for ${data.orgName}`);
  }

  async sendAbandonedCartEmail(data: {
    to: string; firstName?: string; name?: string; cartItems: any[];
    cartTotal?: number; resumeUrl?: string; recoveryUrl?: string; couponCode?: string;
  }) {
    this.logger.log(`[STUB] Abandoned cart email to ${data.to}`);
  }

  async sendTemplateEmail(data: {
    to: string; subject: string; template: string;
    variables?: Record<string, any>; data?: Record<string, any>;
  }) {
    this.logger.log(`[STUB] Template email to ${data.to}: ${data.subject}`);
  }

  async sendWinBackEmail(data: {
    to: string; name?: string; firstName?: string;
    lastOrderDate?: Date; offerCode?: string; couponCode?: string; discountPercent?: number;
  }) {
    this.logger.log(`[STUB] Win-back email to ${data.to}`);
  }

  async sendEmail(data: { to: string; subject: string; html: string }) {
    this.logger.log(`[STUB] Email to ${data.to}: ${data.subject}`);
  }
}
