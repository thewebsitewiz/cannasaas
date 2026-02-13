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
var CampaignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("../cart/entities/cart.entity");
const user_entity_1 = require("../users/entities/user.entity");
const mail_service_1 = require("../mail/mail.service");
const marketing_log_entity_1 = require("./entities/marketing-log.entity");
let CampaignService = CampaignService_1 = class CampaignService {
    constructor(cartRepo, userRepo, logRepo, mail) {
        this.cartRepo = cartRepo;
        this.userRepo = userRepo;
        this.logRepo = logRepo;
        this.mail = mail;
        this.logger = new common_1.Logger(CampaignService_1.name);
    }
    async processAbandonedCarts() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const carts = await this.cartRepo.find({
            where: { updatedAt: (0, typeorm_2.LessThan)(oneHourAgo), checkedOut: false },
            relations: ['user'],
        });
        for (const cart of carts) {
            if (!cart.user?.email)
                continue;
            const recent = await this.logRepo.findOne({
                where: { userId: cart.userId, campaignType: 'abandoned_cart',
                    sentAt: (0, typeorm_2.MoreThan)(oneDayAgo) },
            });
            if (recent)
                continue;
            await this.mail.sendAbandonedCartEmail({
                to: cart.user.email, firstName: cart.user.firstName,
                cartItems: cart.items, cartTotal: cart.total,
                recoveryUrl: `/cart?recover=${cart.id}`,
                couponCode: 'COMEBACK10',
            });
            await this.logRepo.save(this.logRepo.create({
                userId: cart.userId, campaignType: 'abandoned_cart',
                sentAt: new Date(), channel: 'email',
            }));
        }
    }
    async processWelcomeSeries() {
        const steps = [
            { day: 0, template: 'welcome_1', subject: 'Welcome to {{store}}!' },
            { day: 2, template: 'welcome_2', subject: 'Discover our top products' },
            { day: 5, template: 'welcome_3', subject: 'Join our loyalty program' },
            { day: 10, template: 'welcome_4', subject: 'Your first-time discount' },
        ];
        for (const step of steps) {
            const target = new Date(Date.now() - step.day * 86400000);
            const dayStart = new Date(target);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(target);
            dayEnd.setHours(23, 59, 59, 999);
            const users = await this.userRepo.find({
                where: { createdAt: (0, typeorm_2.Between)(dayStart, dayEnd) },
            });
            for (const user of users) {
                const sent = await this.logRepo.findOne({
                    where: { userId: user.id, campaignType: `welcome_${step.day}` },
                });
                if (sent)
                    continue;
                await this.mail.sendTemplateEmail({
                    to: user.email, template: step.template,
                    subject: step.subject, data: { firstName: user.firstName },
                });
                await this.logRepo.save(this.logRepo.create({
                    userId: user.id, campaignType: `welcome_${step.day}`,
                    sentAt: new Date(), channel: 'email',
                }));
            }
        }
    }
    async processWinBack() {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        const inactive = await this.userRepo.createQueryBuilder('user')
            .where('user.lastOrderDate < :date', { date: thirtyDaysAgo })
            .andWhere('user.emailOptIn = true').getMany();
        for (const user of inactive) {
            const recent = await this.logRepo.findOne({
                where: { userId: user.id, campaignType: 'win_back',
                    sentAt: (0, typeorm_2.MoreThan)(sevenDaysAgo) },
            });
            if (recent)
                continue;
            await this.mail.sendWinBackEmail({
                to: user.email, firstName: user.firstName,
                couponCode: 'MISSYOU15', discountPercent: 15,
            });
            await this.logRepo.save(this.logRepo.create({
                userId: user.id, campaignType: 'win_back',
                sentAt: new Date(), channel: 'email',
            }));
        }
    }
};
exports.CampaignService = CampaignService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CampaignService.prototype, "processAbandonedCarts", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CampaignService.prototype, "processWelcomeSeries", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CampaignService.prototype, "processWinBack", null);
exports.CampaignService = CampaignService = CampaignService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(marketing_log_entity_1.MarketingLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_1.MailService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map