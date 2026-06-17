import { Injectable } from '@nestjs/common';
import { CompleteOrderInput } from './dto/complete-order.input';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderSummary } from './dto/order-summary.type';
import { OrderCreatorService } from './order-creator.service';
import { OrderQueryService } from './order-query.service';
import { OrderStateMachineService } from './order-state-machine.service';
import type {
  CompleteOrderLineItemRow,
  CompleteOrderRow,
  MyFavoritesRow,
  MyLastOrderRow,
  OrderDetailRow,
  OrderListRow,
} from './order-types';

// Re-export row types so existing consumers (resolvers, downstream
// modules) keep their `import { OrderDetailRow } from '.../orders.service'`
// paths working unchanged.
export type {
  OrderDetailRow,
  OrderListRow,
  MyLastOrderRow,
  MyFavoritesRow,
} from './order-types';

/**
 * Thin facade over the three split services that own the orders
 * aggregate. Created during tech-debt row #4 closure:
 *
 *  - {@link OrderCreatorService} — `createOrder`, tax/THC math,
 *    transactional product-resolve + stock reserve
 *  - {@link OrderStateMachineService} — `confirmOrder`,
 *    `startPreparing`, `markReady`, `completeOrder`, `cancelOrder`
 *  - {@link OrderQueryService} — `getOrder`, `listOrders`,
 *    `myOrders`, `myLastOrder`, `myFavorites`
 *
 * Resolvers still hold a single `OrdersService` reference; this
 * facade keeps that contract intact while letting each concern
 * live in its own file.
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly creator: OrderCreatorService,
    private readonly stateMachine: OrderStateMachineService,
    private readonly queries: OrderQueryService,
  ) {}

  createOrder(
    input: CreateOrderInput,
    staffUserId?: string,
  ): Promise<OrderSummary> {
    return this.creator.createOrder(input, staffUserId);
  }

  getOrder(orderId: string, dispensaryId: string): Promise<OrderDetailRow> {
    return this.queries.getOrder(orderId, dispensaryId);
  }

  listOrders(
    dispensaryId: string,
    limit?: number,
    offset?: number,
  ): Promise<OrderListRow[]> {
    return this.queries.listOrders(dispensaryId, limit, offset);
  }

  confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    return this.stateMachine.confirmOrder(orderId, dispensaryId);
  }

  startPreparing(orderId: string, dispensaryId: string): Promise<boolean> {
    return this.stateMachine.startPreparing(orderId, dispensaryId);
  }

  markReady(orderId: string, dispensaryId: string): Promise<boolean> {
    return this.stateMachine.markReady(orderId, dispensaryId);
  }

  completeOrder(input: CompleteOrderInput): Promise<{
    order: CompleteOrderRow;
    lineItems: CompleteOrderLineItemRow[];
  }> {
    return this.stateMachine.completeOrder(input);
  }

  cancelOrder(
    orderId: string,
    dispensaryId: string,
    reason: string,
  ): Promise<boolean> {
    return this.stateMachine.cancelOrder(orderId, dispensaryId, reason);
  }

  myOrders(
    customerUserId: string,
    limit?: number,
    offset?: number,
    status?: string,
  ): Promise<OrderListRow[]> {
    return this.queries.myOrders(customerUserId, limit, offset, status);
  }

  myLastOrder(
    customerUserId: string,
    dispensaryId: string,
  ): Promise<MyLastOrderRow | null> {
    return this.queries.myLastOrder(customerUserId, dispensaryId);
  }

  myFavorites(
    customerUserId: string,
    dispensaryId: string,
    limit?: number,
  ): Promise<MyFavoritesRow[]> {
    return this.queries.myFavorites(customerUserId, dispensaryId, limit);
  }
}
