import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class NotificationStats {
  @Field(() => Int) total!: number;
  @Field(() => Int) sent!: number;
  @Field(() => Int) failed!: number;
  @Field(() => Int) skipped!: number;
  @Field(() => Int) emails!: number;
  @Field(() => Int) sms!: number;
}

@Resolver()
export class NotificationResolver {
  constructor(private readonly notifications: NotificationService) {}

  // Customer: My notifications
  @Roles('customer', 'budtender', 'dispensary_admin')
  @Query(() => [NotificationLog], { name: 'myNotifications' })
  async myNotifications(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationLog[]> {
    return this.notifications.getNotificationLog(user.sub, limit);
  }

  // Admin: Templates
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [NotificationTemplate], { name: 'notificationTemplates' })
  async templates(): Promise<NotificationTemplate[]> {
    return this.notifications.getTemplates();
  }

  // Admin: Stats
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => NotificationStats, { name: 'notificationStats' })
  async stats(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('days', { type: () => Int, nullable: true, defaultValue: 30 }) days: number,
  ): Promise<any> {
    return this.notifications.getDispensaryNotificationStats(dispensaryId, days);
  }

  // Admin: Send test notification
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => NotificationLog, { name: 'sendTestEmail' })
  async sendTest(
    @Args('to') to: string,
    @Args('subject') subject: string,
    @Args('body') body: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationLog> {
    return this.notifications.sendEmail({
      to, subject, body,
      userId: user.sub,
      dispensaryId: user.dispensaryId ?? undefined,
      templateCode: 'test',
    });
  }

  // Admin: Send notification to customer by template
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => [NotificationLog], { name: 'notifyCustomer' })
  async notifyCustomer(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('templateCode') templateCode: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<NotificationLog[]> {
    const dispensary = await this.notifications['ds'].query(
      `SELECT name FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );
    return this.notifications.notifyCustomer(userId, templateCode, {
      dispensaryName: dispensary[0]?.name || 'Your Dispensary',
      dispensaryId,
    });
  }
}
