import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type {
  MyFavoritesRow,
  MyLastOrderRow,
  OrderDetailRow,
  OrderListRow,
} from './order-types';

/**
 * Owns every read-only query against the orders aggregate:
 * single-order detail, paginated lists, the customer's own order
 * history, last-order-with-line-items (for "Reorder" cards), and
 * the favorites projection used by storefront express-checkout.
 *
 * Split out of the original `OrdersService` (tech-debt row #4).
 */
@Injectable()
export class OrderQueryService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getOrder(
    orderId: string,
    dispensaryId: string,
  ): Promise<OrderDetailRow> {
    const rows: OrderDetailRow[] = await this.dataSource.query(
      `SELECT
         o.order_id AS "orderId",
         o.dispensary_id AS "dispensaryId",
         o.customer_user_id AS "customerUserId",
         o.staff_user_id AS "staffUserId",
         o.order_type AS "orderType",
         o.order_status AS "orderStatus",
         o.subtotal,
         o.discount_total AS "discountTotal",
         o.tax_total AS "taxTotal",
         o.total,
         o.payment_method AS "paymentMethod",
         o.created_at AS "createdAt",
         o.updated_at AS "updatedAt",
         json_agg(json_build_object(
           'lineItemId', li.line_item_id,
           'productId', li.product_id,
           'variantId', li.variant_id,
           'quantity', li.quantity,
           'unitPrice', li.unit_price,
           'taxApplied', li.tax_applied,
           'metrcItemUid', li.metrc_item_uid
         )) as line_items
       FROM orders o
       LEFT JOIN order_line_items li ON li.order_id = o.order_id
       WHERE o.order_id = $1 AND o.dispensary_id = $2
       GROUP BY o.order_id`,
      [orderId, dispensaryId],
    );
    const order = rows[0];
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  async listOrders(
    dispensaryId: string,
    limit = 20,
    offset = 0,
  ): Promise<OrderListRow[]> {
    // Explicitly select only list-view columns; exclude heavy JSONB fields
    // (tax_breakdown, applied_promotions, metrc_receipt_data) to avoid over-fetching
    return this.dataSource.query(
      `SELECT order_id AS "orderId", dispensary_id AS "dispensaryId",
              customer_user_id AS "customerUserId", order_type AS "orderType",
              order_status AS "orderStatus", subtotal,
              tax_total AS "taxTotal", total, payment_method AS "paymentMethod",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders WHERE dispensary_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
  }

  async myOrders(
    customerUserId: string,
    limit = 20,
    offset = 0,
    status?: string,
  ): Promise<OrderListRow[]> {
    const params: unknown[] = [customerUserId, limit, offset];
    let statusFilter = '';
    if (status) {
      statusFilter = `AND order_status = $4`;
      params.push(status);
    }

    return this.dataSource.query(
      `SELECT order_id AS "orderId", dispensary_id AS "dispensaryId",
              order_type AS "orderType", order_status AS "orderStatus",
              subtotal, tax_total AS "taxTotal", total,
              payment_method AS "paymentMethod",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM orders
       WHERE customer_user_id = $1 ${statusFilter}
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      params,
    );
  }

  /**
   * Most recent order for the authenticated customer at the given dispensary,
   * with denormalized line items (product/variant names joined in). Used by
   * the storefront's express checkout's "Reorder Last Order" card.
   */
  async myLastOrder(
    customerUserId: string,
    dispensaryId: string,
  ): Promise<MyLastOrderRow | null> {
    const rows: MyLastOrderRow[] = await this.dataSource.query(
      `SELECT
         o.order_id   AS "orderId",
         o.order_type AS "orderType",
         o.order_status AS "orderStatus",
         o.subtotal,
         o.tax_total AS "taxTotal",
         o.total,
         o.payment_method AS "paymentMethod",
         o.created_at AS "createdAt",
         o.updated_at AS "updatedAt",
         COALESCE(
           json_agg(
             json_build_object(
               'productId', li.product_id,
               'variantId', li.variant_id,
               'productName', p.name,
               'variantName', pv.name,
               'quantity', li.quantity,
               'price', li.unit_price
             ) ORDER BY li.created_at
           ) FILTER (WHERE li.line_item_id IS NOT NULL),
           '[]'::json
         ) AS "lineItems"
       FROM orders o
       LEFT JOIN order_line_items li ON li.order_id   = o.order_id
       LEFT JOIN products p           ON p.id         = li.product_id
       LEFT JOIN product_variants pv  ON pv.variant_id = li.variant_id
       WHERE o.customer_user_id = $1 AND o.dispensary_id = $2
       GROUP BY o.order_id
       ORDER BY o.created_at DESC
       LIMIT 1`,
      [customerUserId, dispensaryId],
    );
    return rows[0] ?? null;
  }

  /**
   * The authenticated customer's most-ordered product variants at this
   * dispensary, with the most recent unit price they paid. Used by the
   * storefront's express checkout's "Your Favorites" card.
   */
  async myFavorites(
    customerUserId: string,
    dispensaryId: string,
    limit = 5,
  ): Promise<MyFavoritesRow[]> {
    return this.dataSource.query(
      `SELECT
         li.product_id  AS "productId",
         li.variant_id  AS "variantId",
         p.name         AS "productName",
         pv.name        AS "variantName",
         (array_agg(li.unit_price ORDER BY o.created_at DESC))[1] AS price,
         COUNT(DISTINCT li.order_id)::int AS "orderCount"
       FROM order_line_items li
       JOIN orders o ON o.order_id = li.order_id
       LEFT JOIN products p          ON p.id = li.product_id
       LEFT JOIN product_variants pv ON pv.variant_id = li.variant_id
       WHERE o.customer_user_id = $1
         AND o.dispensary_id   = $2
         AND o.order_status   != 'cancelled'
       GROUP BY li.product_id, li.variant_id, p.name, pv.name
       ORDER BY "orderCount" DESC, MAX(o.created_at) DESC
       LIMIT $3`,
      [customerUserId, dispensaryId, limit],
    );
  }
}
