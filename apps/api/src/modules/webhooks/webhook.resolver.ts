import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { WebhookService } from './webhook.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ForbiddenException } from '@nestjs/common';

@ObjectType() class WebhookEndpoint {
  @Field(() => ID) webhook_id!: string;
  @Field(() => ID) dispensary_id!: string;
  @Field() url!: string;
  @Field(() => [String]) events!: string[];
  @Field() is_active!: boolean;
  @Field(() => Date) created_at!: Date;
}

@ObjectType() class WebhookEndpointWithSecret {
  @Field(() => ID) webhook_id!: string;
  @Field(() => ID) dispensary_id!: string;
  @Field() url!: string;
  @Field(() => [String]) events!: string[];
  @Field() secret!: string;
  @Field() is_active!: boolean;
  @Field(() => Date) created_at!: Date;
}

@ObjectType() class WebhookDelivery {
  @Field(() => ID) delivery_id!: string;
  @Field(() => ID) webhook_id!: string;
  @Field() event_type!: string;
  @Field() status!: string;
  @Field(() => Int, { nullable: true }) response_status?: number;
  @Field({ nullable: true }) response_body?: string;
  @Field(() => Int) attempts!: number;
  @Field(() => Date, { nullable: true }) delivered_at?: Date;
  @Field(() => Date) created_at!: Date;
}

@Resolver()
export class WebhookResolver {
  constructor(private readonly webhooks: WebhookService) {}

  private resolveDispensary(user: JwtPayload, dispensaryId?: string): string {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return targetId;
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => WebhookEndpointWithSecret, { name: 'registerWebhook' })
  async register(
    @Args('url') url: string,
    @Args('events', { type: () => [String] }) events: string[],
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.webhooks.registerWebhook(this.resolveDispensary(user, dispensaryId), url, events);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deleteWebhook' })
  async delete(
    @Args('webhookId', { type: () => ID }) webhookId: string,
  ): Promise<boolean> {
    return this.webhooks.deleteWebhook(webhookId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [WebhookEndpoint], { name: 'webhooks' })
  async list(
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any[]> {
    return this.webhooks.listWebhooks(this.resolveDispensary(user, dispensaryId));
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [WebhookDelivery], { name: 'webhookDeliveries' })
  async deliveries(
    @Args('webhookId', { type: () => ID }) webhookId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
  ): Promise<any[]> {
    return this.webhooks.getDeliveryHistory(webhookId, limit);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => WebhookDelivery, { name: 'retryWebhookDelivery' })
  async retry(
    @Args('deliveryId', { type: () => ID }) deliveryId: string,
  ): Promise<any> {
    return this.webhooks.retryDelivery(deliveryId);
  }
}
