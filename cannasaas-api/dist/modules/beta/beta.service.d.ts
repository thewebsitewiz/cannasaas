import { Repository } from 'typeorm';
import { BetaInvitation } from './entities/beta-invitation.entity';
import { BetaFeedback } from './entities/beta-feedback.entity';
import { MailService } from '../mail/mail.service';
export declare class BetaService {
    private inviteRepo;
    private feedbackRepo;
    private mail;
    constructor(inviteRepo: Repository<BetaInvitation>, feedbackRepo: Repository<BetaFeedback>, mail: MailService);
    createInvitation(email: string, name: string): Promise<BetaInvitation>;
    acceptInvitation(code: string): Promise<BetaInvitation>;
    submitFeedback(dto: {
        organizationId: string;
        userId: string;
        type: 'bug' | 'feature_request' | 'usability' | 'general';
        severity: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        metadata?: Record<string, any>;
    }): Promise<BetaFeedback>;
    getMetrics(): Promise<{
        totalInvitations: number;
        acceptedInvitations: number;
        conversionRate: string;
        totalFeedback: number;
        criticalBugs: number;
    }>;
}
