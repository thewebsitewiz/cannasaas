"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nanoid_1 = require("nanoid");
const beta_invitation_entity_1 = require("./entities/beta-invitation.entity");
const beta_feedback_entity_1 = require("./entities/beta-feedback.entity");
const mail_service_1 = require("../mail/mail.service");
let BetaService = class BetaService {
    constructor(inviteRepo, feedbackRepo, mail) {
        this.inviteRepo = inviteRepo;
        this.feedbackRepo = feedbackRepo;
        this.mail = mail;
    }
    async createInvitation(email, name) {
        const code = `BETA-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        const invite = this.inviteRepo.create({
            email, name, code,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await this.inviteRepo.save(invite);
        await this.mail.sendBetaInvitation({ to: email, name, code });
        return invite;
    }
    async acceptInvitation(code) {
        const invite = await this.inviteRepo.findOne({ where: { code } });
        if (!invite)
            throw new common_1.NotFoundException('Invalid invitation code');
        if (invite.acceptedAt)
            throw new common_1.BadRequestException('Already accepted');
        if (invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invitation expired');
        invite.acceptedAt = new Date();
        await this.inviteRepo.save(invite);
        return invite;
    }
    async submitFeedback(dto) {
        return this.feedbackRepo.save(this.feedbackRepo.create(dto));
    }
    async getMetrics() {
        const total = await this.inviteRepo.count();
        const accepted = await this.inviteRepo.count({
            where: { acceptedAt: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
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
};
exports.BetaService = BetaService;
exports.BetaService = BetaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(beta_invitation_entity_1.BetaInvitation)),
    __param(1, (0, typeorm_1.InjectRepository)(beta_feedback_entity_1.BetaFeedback)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], BetaService);
//# sourceMappingURL=beta.service.js.map