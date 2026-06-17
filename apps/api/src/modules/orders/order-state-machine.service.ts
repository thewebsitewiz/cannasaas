import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompleteOrderInput } from './dto/complete-order.input';
import { OrderCompletedEvent } from './events/order-completed.event';
import { ORDER_COMPLETED } from '../../common/events/event-names';
import {
  dmlRowCount,
  OrderEventEmitterService,
  OrderStockEventBridgeService,
  type ReserveReturningRow,
  runnerQuery,
} from './order-helpers';
import type {
  CancelLineItemRow,
  CancelOrderRow,
  CompleteOrderLineItemRow,
  CompleteOrderRow,
} from './order-types';

/**
 * Owns every status-changing mutation on an existing order:
 * confirm → preparing → ready → completed, plus cancel.
 *
 * `completeOrder` and `cancelOrder` run inside transactions and emit
 * stock-change / order-status events post-commit. The simpler
 * status flips (`confirm`, `startPreparing`, `markReady`) are single
 * conditional UPDATEs that only emit on success.
 *
 * Split out of the original `OrdersService` (tech-debt row #4).
 */
@Injectable()
export class OrderStateMachineService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly orderEvents: OrderEventEmitterService,
    private readonly stockBridge: OrderStockEventBridgeService,
  ) {}

  async confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    const result: unknown = await this.dataSource.query(
      `UPDATE orders SET order_status = 'confirmed', updated_at = NOW()
       WHERE order_id = $1 AND dispensary_id = $2 AND order_status = 'pending'`,
      [orderId, dispensaryId],
    );
    const updated = dmlRowCount(result) > 0;
    if (updated)
      void this.orderEvents
        .emit(orderId, dispensaryId, 'confirmed')
        .catch(() => undefined);
    return updated;
  }

  async startPreparing(
    orderId: string,
    dispensaryId: string,
  ): Promise<boolean> {
    const result: unknown = await this.dataSource.query(
      `UPDATE orders SET order_status = 'preparing', updated_at = NOW()
       WHERE order_id = $1 AND dispensary_id = $2 AND order_status = 'confirmed'`,
      [orderId, dispensaryId],
    );
    const updated = dmlRowCount(result) > 0;
    if (updated)
      void this.orderEvents
        .emit(orderId, dispensaryId, 'preparing')
        .catch(() => undefined);
    return updated;
  }

  async markReady(orderId: string, dispensaryId: string): Promise<boolean> {
    const result: unknown = await this.dataSource.query(
      `UPDATE orders SET order_status = 'ready', updated_at = NOW()
       WHERE order_id = $1 AND dispensary_id = $2 AND order_status = 'preparing'`,
      [orderId, dispensaryId],
    );
    const updated = dmlRowCount(result) > 0;
    if (updated)
      void this.orderEvents
        .emit(orderId, dispensaryId, 'ready')
        .catch(() => undefined);
    return updated;
  }

  async completeOrder(input: CompleteOrderInput): Promise<{
    order: CompleteOrderRow;
    lineItems: CompleteOrderLineItemRow[];
  }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Get order
      const orderRows = await runnerQuery<CompleteOrderRow>(
        qr,
        `SELECT order_id AS "orderId", dispensary_id AS "dispensaryId",
                order_status AS "orderStatus", subtotal,
                tax_total AS "taxTotal", total, tax_breakdown AS "taxBreakdown",
                customer_user_id AS "customerUserId", order_type AS "orderType",
                created_at AS "createdAt"
         FROM orders WHERE order_id = $1 AND dispensary_id = $2`,
        [input.orderId, input.dispensaryId],
      );
      const order = orderRows[0];
      if (!order) throw new Error('Order not found');
      if (order.orderStatus === 'completed')
        throw new Error('Order already completed');
      if (order.orderStatus === 'cancelled')
        throw new Error('Cannot complete a cancelled order');

      // Get line items
      const lineItems = await runnerQuery<CompleteOrderLineItemRow>(
        qr,
        `SELECT li.line_item_id AS "lineItemId", li.product_id AS "productId",
                li.variant_id AS "variantId", li.quantity,
                li.unit_price AS "unitPrice", li.tax_applied AS "taxApplied",
                li.metrc_item_uid AS "metrcItemUid",
                li.metrc_package_label AS "metrcPackageLabel",
                p.name as product_name
         FROM order_line_items li
         JOIN products p ON p.id = li.product_id
         WHERE li.order_id = $1`,
        [input.orderId],
      );

      // Update order status
      await qr.query(
        `UPDATE orders SET
          order_status = 'completed',
          metrc_receipt_id = $1,
          metrc_sync_status = 'pending',
          updated_at = NOW()
         WHERE order_id = $2`,
        [input.metrcReceiptId ?? null, input.orderId],
      );

      // Move reserved inventory to sold (decrement quantity_on_hand)
      for (const item of lineItems) {
        if (item.variantId) {
          await qr.query(
            `UPDATE inventory
             SET quantity_on_hand = quantity_on_hand - $1,
                 quantity_reserved = quantity_reserved - $1,
                 updated_at = NOW()
             WHERE dispensary_id = $2 AND variant_id = $3 AND quantity_on_hand >= $1`,
            [item.quantity, input.dispensaryId, item.variantId],
          );
        }
      }

      await qr.commitTransaction();

      // Fire event — triggers Metrc sale sync via OrderCompletedListener
      this.eventEmitter.emit(
        ORDER_COMPLETED,
        new OrderCompletedEvent(input.orderId, input.dispensaryId, new Date()),
      );

      // Notify customer of completion
      void this.orderEvents
        .emit(input.orderId, input.dispensaryId, 'completed')
        .catch(() => undefined);

      return { order, lineItems };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async cancelOrder(
    orderId: string,
    dispensaryId: string,
    reason: string,
  ): Promise<boolean> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const orderRows = await runnerQuery<CancelOrderRow>(
        qr,
        `SELECT order_id AS "orderId", order_status AS "orderStatus"
         FROM orders
         WHERE order_id = $1 AND dispensary_id = $2
         FOR UPDATE`,
        [orderId, dispensaryId],
      );
      const order = orderRows[0];
      if (!order) throw new NotFoundException('Order not found');
      if (
        order.orderStatus === 'completed' ||
        order.orderStatus === 'cancelled'
      ) {
        throw new BadRequestException(
          `Cannot cancel an order with status "${order.orderStatus}"`,
        );
      }

      const lineItems = await runnerQuery<CancelLineItemRow>(
        qr,
        `SELECT variant_id AS "variantId", quantity
         FROM order_line_items
         WHERE order_id = $1`,
        [orderId],
      );

      const stockChanges: ReserveReturningRow[] = [];

      for (const item of lineItems) {
        if (item.variantId) {
          // Release reserved → available, capture pre/post state for emission.
          const releaseRows = await runnerQuery<ReserveReturningRow>(
            qr,
            `UPDATE inventory
             SET quantity_reserved = GREATEST(quantity_reserved - $1, 0),
                 quantity_available = quantity_available + $1,
                 updated_at = NOW()
             WHERE dispensary_id = $2 AND variant_id = $3
             RETURNING inventory_id, variant_id,
                       quantity_available::text AS new_available,
                       (quantity_available - $1)::text AS prev_available,
                       reorder_threshold::text AS reorder_threshold`,
            [item.quantity, dispensaryId, item.variantId],
          );
          stockChanges.push(...releaseRows);
        }
      }

      await qr.query(
        `UPDATE orders
         SET order_status = 'cancelled',
             cancellation_reason = $1,
             cancelled_at = NOW(),
             updated_at = NOW()
         WHERE order_id = $2`,
        [reason, orderId],
      );

      await qr.commitTransaction();

      void this.stockBridge
        .emit(stockChanges, dispensaryId, 'release')
        .catch(() => undefined);

      // Notify customer of cancellation
      void this.orderEvents
        .emit(orderId, dispensaryId, 'cancelled')
        .catch(() => undefined);

      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
