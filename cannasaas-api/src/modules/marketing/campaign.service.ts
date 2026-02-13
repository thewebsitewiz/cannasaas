// cannasaas-api/src/modules/marketing/campaign.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MarketingLog } from './entities/marketing-log.entity';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(MarketingLog) private logRepo: Repository<MarketingLog>,
    private mail: MailService,
  ) {}

  // Abandoned Cart Recovery - every 30 minutes
  @Cron('*/30 * * * *')
  async processAbandonedCarts() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = await this.cartRepo.find({
      where: { updatedAt: LessThan(oneHourAgo), checkedOut: false },
      relations: ['user'],
    });

    for (const cart of carts) {
      if (!cart.user?.email) continue;
      const recent = await this.logRepo.findOne({
        where: { userId: cart.userId, campaignType: 'abandoned_cart',
          sentAt: MoreThan(oneDayAgo) },
      });
      if (recent) continue;

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

  // Welcome Drip - every hour
  @Cron(CronExpression.EVERY_HOUR)
  async processWelcomeSeries() {
    const steps = [
      { day: 0, template: 'welcome_1', subject: 'Welcome to {{store}}!' },
      { day: 2, template: 'welcome_2', subject: 'Discover our top products' },
      { day: 5, template: 'welcome_3', subject: 'Join our loyalty program' },
      { day: 10, template: 'welcome_4', subject: 'Your first-time discount' },
    ];
    for (const step of steps) {
      const target = new Date(Date.now() - step.day * 86400000);
      const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(target); dayEnd.setHours(23, 59, 59, 999);

      const users = await this.userRepo.find({
        where: { createdAt: Between(dayStart, dayEnd) },
      });
      for (const user of users) {
        const sent = await this.logRepo.findOne({
          where: { userId: user.id, campaignType: `welcome_${step.day}` },
        });
        if (sent) continue;
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

  // Win-Back - daily at 9 AM
  @Cron('0 9 * * *')
  async processWinBack() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const inactive = await this.userRepo.createQueryBuilder('user')
      .where('user.lastOrderDate < :date', { date: thirtyDaysAgo })
      .andWhere('user.emailOptIn = true').getMany();

    for (const user of inactive) {
      const recent = await this.logRepo.findOne({
        where: { userId: user.id, campaignType: 'win_back',
          sentAt: MoreThan(sevenDaysAgo) },
      });
      if (recent) continue;
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
}
