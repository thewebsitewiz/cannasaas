import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  Float,
  ObjectType,
  Field,
} from '@nestjs/graphql';
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

/** Customer-facing line item for `myLastOrder`. Includes denormalized names. */
@ObjectType()
class CustomerOrderLineItem {
  @Field(() => ID) productId!: string;
  @Field(() => ID, { nullable: true }) variantId?: string;
  @Field({ nullable: true }) productName?: string;
  @Field({ nullable: true }) variantName?: string;
  @Field(() => Float) quantity!: number;
  @Field(() => Float) price!: number;
}

/** Customer-facing summary of an order, including line items. */
@ObjectType()
class CustomerOrder {
  @Field(() => ID) orderId!: string;
  @Field() orderType!: string;
  @Field() orderStatus!: string;
  @Field(() => Float) subtotal!: number;
  @Field(() => Float) taxTotal!: number;
  @Field(() => Float) total!: number;
  @Field({ nullable: true }) paymentMethod?: string;
  @Field(() => Date) createdAt!: Date;
  @Field(() => [CustomerOrderLineItem]) lineItems!: CustomerOrderLineItem[];
}

/** Aggregated entry for `myFavorites`. */
@ObjectType()
class CustomerFavorite {
  @Field(() => ID) productId!: string;
  @Field(() => ID, { nullable: true }) variantId?: string;
  @Field({ nullable: true }) productName?: string;
  @Field({ nullable: true }) variantName?: string;
  @Field(() => Float) price!: number;
  @Field(() => Int) orderCount!: number;
}

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly orders: OrdersService,
    private readonly metrc: MetrcService,
    private readonly syncQueue: MetrcSyncQueueService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Mutation(() => OrderSummary, { name: 'createOrder' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderSummary> {
    if (user.role === 'budtender' || user.role === 'dispensary_admin') {
      if (input.dispensaryId !== user.dispensaryId)
        throw new ForbiddenException('Access denied');
    }
    return this.orders.createOrder(input, user.sub);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Query(() => [Order], { name: 'myOrders' })
  async myOrders(
    @CurrentUser() user: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    rawLimit = 20,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset = 0,
    @Args('status', { nullable: true }) status?: string,
  ): Promise<any[]> {
    const limit = Math.min(rawLimit, 100);
    return this.orders.myOrders(user.sub, limit, offset, status);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Query(() => [Order], { name: 'orders' })
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    rawLimit = 50,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<any[]> {
    const limit = Math.min(rawLimit, 100);
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (
      (user.role === 'budtender' || user.role === 'dispensary_admin') &&
      targetId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.listOrders(targetId, limit, offset);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Query(() => Order, { name: 'order', nullable: true })
  async getOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<any> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    return this.orders.getOrder(orderId, targetId);
  }

  /** The signed-in customer's most recent order at the given dispensary. */
  @Roles('customer', 'budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => CustomerOrder, { name: 'myLastOrder', nullable: true })
  async myLastOrder(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
  ): Promise<any | null> {
    return this.orders.myLastOrder(user.sub, dispensaryId);
  }

  /** The signed-in customer's most-ordered variants at the given dispensary. */
  @Roles('customer', 'budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [CustomerFavorite], { name: 'myFavorites' })
  async myFavorites(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    rawLimit = 5,
  ): Promise<any[]> {
    const limit = Math.min(Math.max(rawLimit, 1), 20);
    return this.orders.myFavorites(user.sub, dispensaryId, limit);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'cancelOrder' })
  async cancelOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.orders.cancelOrder(orderId, targetId, reason);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Mutation(() => Boolean, { name: 'confirmOrder' })
  async confirmOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (
      (user.role === 'budtender' || user.role === 'dispensary_admin') &&
      targetId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.confirmOrder(orderId, targetId);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Mutation(() => Boolean, { name: 'startPreparingOrder' })
  async startPreparing(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (
      (user.role === 'budtender' || user.role === 'dispensary_admin') &&
      targetId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.startPreparing(orderId, targetId);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Mutation(() => Boolean, { name: 'markOrderReady' })
  async markReady(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<boolean> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (
      (user.role === 'budtender' || user.role === 'dispensary_admin') &&
      targetId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.orders.markReady(orderId, targetId);
  }

  @Roles(
    'customer',
    'budtender',
    'dispensary_admin',
    'org_admin',
    'super_admin',
  )
  @Mutation(() => Boolean, { name: 'completeOrder' })
  async completeOrder(
    @Args('input') input: CompleteOrderInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetId = input.dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (
      (user.role === 'budtender' || user.role === 'dispensary_admin') &&
      targetId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    await this.orders.completeOrder(input);

    // Enqueue Metrc sync with retry backoff
    this.syncQueue
      .enqueueSaleSync(input.orderId, targetId)
      .catch((err: any) => console.warn('Metrc queue error:', err?.message));

    return true;
  }
}
