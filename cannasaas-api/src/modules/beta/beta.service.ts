// cannasaas-api/src/modules/beta/beta.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { nanoid } from 'nanoid';
import { BetaInvitation } from './entities/beta-invitation.entity';
import { BetaFeedback } from './entities/beta-feedback.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BetaService {
  constructor(
    @InjectRepository(BetaInvitation)
    private inviteRepo: Repository<BetaInvitation>,
    @InjectRepository(BetaFeedback)
    private feedbackRepo: Repository<BetaFeedback>,
    private mail: MailService,
  ) {}

  async createInvitation(email: string, name: string) {
    const code = `BETA-${nanoid(8).toUpperCase()}`;
    const invite = this.inviteRepo.create({
      email, name, code,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    await this.inviteRepo.save(invite);
    await this.mail.sendBetaInvitation({ to: email, name, code });
    return invite;
  }

  async acceptInvitation(code: string) {
    const invite = await this.inviteRepo.findOne({ where: { code } });
    if (!invite) throw new NotFoundException('Invalid invitation code');
    if (invite.acceptedAt) throw new BadRequestException('Already accepted');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invitation expired');

    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);
    return invite;
  }

  async submitFeedback(dto: {
    organizationId: string; userId: string;
    type: 'bug' | 'feature_request' | 'usability' | 'general';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string; description: string;
    metadata?: Record<string, any>;
  }) {
    return this.feedbackRepo.save(this.feedbackRepo.create(dto));
  }

  async getMetrics() {
    const total = await this.inviteRepo.count();
    const accepted = await this.inviteRepo.count({
      where: { acceptedAt: Not(IsNull()) },
    });
    const feedbackCount = await this.feedbackRepo.count();
    const criticalBugs = await this.feedbackRepo.count({
      where: { type: 'bug', severity: 'critical' },
    });
    return {
      totalInvitations: total, acceptedInvitations: accepted,
      conversionRate: total > 0 ? (accepted / total * 100).toFixed(1) : '0',
      totalFeedback: feedbackCount, criticalBugs,
    };
  }
}
