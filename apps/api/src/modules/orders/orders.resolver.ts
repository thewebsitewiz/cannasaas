import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MetrcService } from '../metrc/metrc.service';
import { MetrcSyncQueueService } from '../metrc/queue/metrc-sync.queue-service';
import { Order } from './entities/order.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { CompleteOrderInput } from './dto/complete-order.input';
import { OrderSummary } from './dto/order-summary.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly orders: OrdersService,
    private readonly metrc: MetrcService,
    private readonly syncQueue: MetrcSyncQueueService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => OrderSummary, { name: 'createOrder' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderSummary> {
    if (user.role === 'budtender' || user.role === 'dispensary_admin') {
      if (input.dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    }
    return this.orders.createOrder(input, user.sub);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [Order], { name: 'orders' })
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) rawLimit: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<any[]> {
    const limit = Math.min(rawLimit, 100);
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if ((user.role === 'budtender' || user.role === 'dispensary_admin') && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.listOrders(targetId, limit, offset);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => Order, { name: 'order', nullable: true })
  async getOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<any> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    return this.orders.getOrder(orderId, targetId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'cancelOrder' })
  async cancelOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.orders.cancelOrder(orderId, targetId, reason);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'confirmOrder' })
  async confirmOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if ((user.role === 'budtender' || user.role === 'dispensary_admin') && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.confirmOrder(orderId, targetId);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'completeOrder' })
  async completeOrder(
    @Args('input') input: CompleteOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetId = input.dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if ((user.role === 'budtender' || user.role === 'dispensary_admin') && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    await this.orders.completeOrder(input);

    // Enqueue Metrc sync with retry backoff
    this.syncQueue.enqueueSaleSync(input.orderId, targetId)
      .catch((err: any) => console.warn('Metrc queue error:', err?.message));

    return true;
  }
}
