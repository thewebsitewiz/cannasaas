import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCompletedEvent } from './events/order-completed.event';
import { OrderEvent } from './events/order-event';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateOrderInput } from './dto/create-order.input';
import { CompleteOrderInput } from './dto/complete-order.input';
import { OrderSummary, TaxLineItem } from './dto/order-summary.type';
import { StockEventEmitterService } from '../inventory/stock-event-emitter.service';
import type { StockChangeSource } from '../inventory/stock-events';
import {
  ORDER_COMPLETED,
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
} from '../../common/events/event-names';

interface ReserveReturningRow {
  inventory_id: string;
  variant_id: string;
  new_available: string;
  prev_available: string;
  reorder_threshold: string | null;
}

/** Row shape returned from lkp_tax_categories */
interface TaxCategoryRow {
  tax_category_id: number;
  code: string;
  state: string;
  name: string;
  tax_basis: 'retail_price' | 'per_mg_thc' | 'wholesale_price';
  rate: string; // numeric comes back as string from pg
  effective_date: string;
  statutory_reference: string;
  is_active: boolean;
}

/** Product type code from lkp_product_types */
type ProductTypeCode = string;

interface OrderEventRow {
  customerUserId: string | null;
  orderType: string;
  total: string | null;
}

interface DispensaryStateRow {
  entity_id: string;
  state: string;
  is_active: boolean;
}

interface ProductLookupRow {
  id: string;
  name: string;
  is_active: boolean;
  is_approved: boolean;
  metrc_item_uid: string | null;
  dispensary_id: string;
  total_thc_mg_per_container: string | null;
  product_type_code: string | null;
}

interface PricingRow {
  price: string;
}

interface InventoryAvailabilityRow {
  quantity_available: string;
}

interface OrderInsertRow {
  orderId: string;
  createdAt: Date;
}

interface ResolvedLineItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  metrcItemUid: string | null;
  productTypeCode: ProductTypeCode | null;
  totalThcMg: number;
}

export interface OrderDetailRow {
  orderId: string;
  dispensaryId: string;
  customerUserId: string | null;
  staffUserId: string | null;
  orderType: string;
  orderStatus: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  line_items: Array<{
    lineItemId: string | null;
    productId: string | null;
    variantId: string | null;
    quantity: string | null;
    unitPrice: string | null;
    taxApplied: string | null;
    metrcItemUid: string | null;
  }>;
}

export interface OrderListRow {
  orderId: string;
  dispensaryId: string;
  customerUserId: string | null;
  orderType: string;
  orderStatus: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

interface CompleteOrderRow {
  orderId: string;
  dispensaryId: string;
  orderStatus: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  taxBreakdown: TaxLineItem[] | null;
  customerUserId: string | null;
  orderType: string;
  createdAt: Date;
}

interface CompleteOrderLineItemRow {
  lineItemId: string;
  productId: string;
  variantId: string | null;
  quantity: string;
  unitPrice: string;
  taxApplied: string;
  metrcItemUid: string | null;
  metrcPackageLabel: string | null;
  product_name: string;
}

interface CancelOrderRow {
  orderId: string;
  orderStatus: string;
}

interface CancelLineItemRow {
  variantId: string | null;
  quantity: string;
}

export interface MyLastOrderRow {
  orderId: string;
  orderType: string;
  orderStatus: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  paymentMethod: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  lineItems: Array<{
    productId: string;
    variantId: string | null;
    productName: string | null;
    variantName: string | null;
    quantity: number;
    price: number;
  }>;
}

export interface MyFavoritesRow {
  productId: string;
  variantId: string | null;
  productName: string | null;
  variantName: string | null;
  price: number;
  orderCount: number;
}

/**
 * Narrows the loose return of `DataSource.query(...)` for DML statements into
 * a row count. node-postgres returns `{ rowCount, command, oid, fields, rows }`
 * but some adapters historically returned `[rows, rowCount]`. This handles
 * both and falls back to 0.
 */
function dmlRowCount(result: unknown): number {
  if (Array.isArray(result)) {
    const second: unknown = result[1];
    return typeof second === 'number' ? second : 0;
  }
  if (result !== null && typeof result === 'object' && 'rowCount' in result) {
    const rc = (result as { rowCount?: unknown }).rowCount;
    return typeof rc === 'number' ? rc : 0;
  }
  return 0;
}

/**
 * Maps product_type codes to the per_mg_thc tax code suffix.
 * FLOWER / PRE_ROLL -> FLOWER, VAPE / CONCENTRATE -> CONCENTRATE,
 * EDIBLE / BEVERAGE / TINCTURE / CAPSULE -> EDIBLE.
 * Products that don't match (TOPICAL, ACCESSORY, HEMP_CBD) are not
 * subject to per-mg-THC excise — those rules will simply be skipped.
 */
const THC_TAX_CATEGORY_MAP: Record<string, string> = {
  FLOWER: 'FLOWER',
  PRE_ROLL: 'FLOWER',
  VAPE: 'CONCENTRATE',
  CONCENTRATE: 'CONCENTRATE',
  EDIBLE: 'EDIBLE',
  BEVERAGE: 'EDIBLE',
  TINCTURE: 'EDIBLE',
  CAPSULE: 'EDIBLE',
  SUPPOSITORY: 'EDIBLE',
  PATCH: 'EDIBLE',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly stockEvents: StockEventEmitterService,
  ) {}

  /**
   * Translate a batch of inventory `UPDATE … RETURNING` rows into
   * `StockEventEmitterService.recordChange` calls. Used by the order
   * reserve / cancel paths so customer orders flow through the same
   * event pipeline as manual adjustments (sc-113). Emitting happens
   * post-commit; a failure to emit never rolls back the order.
   */
  private async emitStockChanges(
    rows: ReserveReturningRow[],
    dispensaryId: string,
    source: StockChangeSource,
  ): Promise<void> {
    for (const row of rows) {
      try {
        await this.stockEvents.recordChange({
          dispensaryId,
          inventoryId: row.inventory_id,
          variantId: row.variant_id,
          previousAvailable: Number(row.prev_available),
          newAvailable: Number(row.new_available),
          reorderThreshold:
            row.reorder_threshold != null
              ? Number(row.reorder_threshold)
              : null,
          source,
        });
      } catch (err) {
        this.logger.warn(
          `emitStockChanges: recordChange failed for variant=${row.variant_id}: ${
            err instanceof Error ? err.message : 'unknown'
          }`,
        );
      }
    }
  }

  /**
   * Typed wrapper around `QueryRunner.query` — TypeORM declares it as
   * `Promise<any>` (no generic), so without a wrapper every awaited row
   * is `any` and trips no-unsafe-assignment. DataSource.query, in contrast,
   * IS generic (`query<T = any>`) so a typed variable annotation on those
   * call sites infers T contextually and lints clean.
   */
  private async runnerQuery<T>(
    qr: QueryRunner,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const rows: unknown = await qr.query(sql, params);
    return rows as T[];
  }

  /**
   * Fetches order context and emits an OrderEvent.
   * Notifications are handled by the NotificationService listener.
   */
  private async emitOrderEvent(
    orderId: string,
    dispensaryId: string,
    status: string,
  ): Promise<void> {
    try {
      const rows: OrderEventRow[] = await this.dataSource.query(
        `SELECT customer_user_id AS "customerUserId", order_type AS "orderType", total
         FROM orders WHERE order_id = $1`,
        [orderId],
      );
      const order = rows[0];
      if (!order) return;
      this.eventEmitter.emit(
        status === 'pending' ? ORDER_CREATED : ORDER_STATUS_CHANGED,
        new OrderEvent(
          orderId,
          dispensaryId,
          status,
          order.customerUserId,
          order.orderType,
          order.total ? parseFloat(order.total) : null,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to emit order event: ${message}`);
    }
  }

  private async getTaxRulesForState(
    qr: QueryRunner,
    state: string,
  ): Promise<TaxCategoryRow[]> {
    try {
      const rows = await this.runnerQuery<TaxCategoryRow>(
        qr,
        `SELECT tax_category_id, code, state, name, tax_basis, rate,
                effective_date, statutory_reference, is_active
         FROM lkp_tax_categories
         WHERE state = $1 AND is_active = true
         ORDER BY tax_category_id`,
        [state],
      );
      return rows;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to fetch tax rules for state=${state}: ${message}. Falling back to zero tax.`,
      );
      return [];
    }
  }

  /**
   * Calculates tax for an order based on DB-driven lkp_tax_categories rules.
   *
   * - retail_price / wholesale_price basis: rate * subtotal
   * - per_mg_thc basis: rate * total THC mg across qualifying line items
   *
   * Returns the same shape the rest of the service expects: { taxTotal, taxBreakdown }.
   */
  private calculateTaxes(
    taxRules: TaxCategoryRow[],
    subtotal: number,
    resolvedItems: Array<{
      productTypeCode: ProductTypeCode | null;
      totalThcMg: number;
    }>,
  ): { taxTotal: number; taxBreakdown: TaxLineItem[] } {
    const taxBreakdown: TaxLineItem[] = [];
    let taxTotal = 0;

    for (const rule of taxRules) {
      const rate = parseFloat(rule.rate);
      if (!rate || rate <= 0) continue;

      let amount = 0;

      if (rule.tax_basis === 'per_mg_thc') {
        // Determine which product-type suffix this rule covers from its code.
        // e.g. NY_THC_FLOWER -> FLOWER, CT_EXCISE_CANNABIS -> general THC
        const codeSuffix = rule.code.split('_').pop()?.toUpperCase() ?? '';
        const isGeneralThcExcise = ![
          'FLOWER',
          'CONCENTRATE',
          'EDIBLE',
        ].includes(codeSuffix);

        let applicableThcMg = 0;
        for (const item of resolvedItems) {
          const mappedCategory = item.productTypeCode
            ? THC_TAX_CATEGORY_MAP[item.productTypeCode]
            : null;

          if (isGeneralThcExcise) {
            // General per-mg-THC excise applies to all products with THC
            applicableThcMg += item.totalThcMg;
          } else if (mappedCategory === codeSuffix) {
            applicableThcMg += item.totalThcMg;
          }
        }

        amount = Math.round(applicableThcMg * rate * 100) / 100;
      } else {
        // retail_price or wholesale_price — apply rate to subtotal
        amount = Math.round(subtotal * rate * 100) / 100;
      }

      if (amount > 0) {
        taxTotal += amount;
        const ratePercent =
          rule.tax_basis === 'per_mg_thc'
            ? rate // per-mg rate shown as-is (dollars per mg)
            : rate * 100; // percentage
        taxBreakdown.push({ label: rule.name, ratePercent, amount });
      }
    }

    return { taxTotal: Math.round(taxTotal * 100) / 100, taxBreakdown };
  }

  async createOrder(
    input: CreateOrderInput,
    staffUserId?: string,
  ): Promise<OrderSummary> {
    // Pre-transaction validation — fail fast before starting a DB transaction
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new BadRequestException(
        'Order must contain at least one line item',
      );
    }

    // Verify all quantities are > 0
    const invalidQty = input.lineItems.find((li) => li.quantity <= 0);
    if (invalidQty) {
      throw new BadRequestException(
        `Invalid quantity for product ${invalidQty.productId}: quantity must be greater than 0`,
      );
    }

    // Verify the dispensary exists
    const dispCheckRows: Array<{ entity_id: string }> =
      await this.dataSource.query(
        `SELECT entity_id FROM dispensaries WHERE entity_id = $1`,
        [input.dispensaryId],
      );
    if (!dispCheckRows[0]) {
      throw new BadRequestException(
        `Dispensary ${input.dispensaryId} does not exist`,
      );
    }

    // Verify all product IDs exist and belong to this dispensary
    const productIds = input.lineItems.map((li) => li.productId);
    const existingProducts: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM products WHERE id = ANY($1) AND dispensary_id = $2`,
      [productIds, input.dispensaryId],
    );
    const existingProductIds = new Set(existingProducts.map((r) => r.id));
    const missingProducts = productIds.filter(
      (id) => !existingProductIds.has(id),
    );
    if (missingProducts.length > 0) {
      throw new BadRequestException(
        `Products not found in this dispensary: ${missingProducts.join(', ')}`,
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Get dispensary state for tax calculation
      const dispRows = await this.runnerQuery<DispensaryStateRow>(
        qr,
        `SELECT entity_id, state, is_active FROM dispensaries WHERE entity_id = $1`,
        [input.dispensaryId],
      );
      const dispensary = dispRows[0];
      if (!dispensary) throw new NotFoundException('Dispensary not found');
      if (!dispensary.is_active)
        throw new BadRequestException('Dispensary is not active');

      const state = dispensary.state;

      // Fetch tax rules from DB instead of using hardcoded rates
      const taxRules = await this.getTaxRulesForState(qr, state);
      if (taxRules.length === 0) {
        this.logger.warn(
          `No active tax rules found for state=${state}, dispensary=${input.dispensaryId}. Order will have zero tax.`,
        );
      }

      // Resolve products and pricing
      let subtotal = 0;
      const resolvedItems: ResolvedLineItem[] = [];

      for (const item of input.lineItems) {
        // Get product with product_type code and THC content for per-mg-THC tax calculation
        const productRows = await this.runnerQuery<ProductLookupRow>(
          qr,
          `SELECT p.id, p.name, p.is_active, p.is_approved, p.metrc_item_uid,
                  p.dispensary_id, p.total_thc_mg_per_container,
                  pt.code AS product_type_code
           FROM products p
           LEFT JOIN lkp_product_types pt ON pt.product_type_id = p.product_type_id
           WHERE p.id = $1 AND p.dispensary_id = $2`,
          [item.productId, input.dispensaryId],
        );
        const product = productRows[0];
        if (!product)
          throw new NotFoundException(`Product ${item.productId} not found`);
        if (!product.is_active)
          throw new BadRequestException(
            `Product "${product.name}" is not active`,
          );

        // Get current price
        let unitPrice = 0;
        if (item.variantId) {
          const pricingRows = await this.runnerQuery<PricingRow>(
            qr,
            `SELECT price FROM product_pricing
             WHERE variant_id = $1 AND price_type = 'retail'
             AND effective_from <= NOW()
             AND (effective_until IS NULL OR effective_until > NOW())
             ORDER BY effective_from DESC LIMIT 1`,
            [item.variantId],
          );
          unitPrice = pricingRows[0] ? parseFloat(pricingRows[0].price) : 0;
        } else {
          // Use first active variant price
          const pricingRows = await this.runnerQuery<PricingRow>(
            qr,
            `SELECT pp.price FROM product_pricing pp
             JOIN product_variants pv ON pv.variant_id = pp.variant_id
             WHERE pv.product_id = $1 AND pv.dispensary_id = $2 AND pv.is_active = true
             AND pp.price_type = 'retail'
             AND pp.effective_from <= NOW()
             AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
             ORDER BY pv.sort_order ASC, pp.effective_from DESC LIMIT 1`,
            [item.productId, input.dispensaryId],
          );
          unitPrice = pricingRows[0] ? parseFloat(pricingRows[0].price) : 0;
        }

        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        // THC mg for the line item: per-container mg * quantity
        const totalThcMg =
          (parseFloat(product.total_thc_mg_per_container ?? '0') || 0) *
          item.quantity;

        resolvedItems.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          metrcItemUid: product.metrc_item_uid,
          productTypeCode: product.product_type_code ?? null,
          totalThcMg,
        });
      }

      // ── Stock validation: reject if any item exceeds available inventory ──
      for (const item of resolvedItems) {
        if (item.variantId) {
          const invRows = await this.runnerQuery<InventoryAvailabilityRow>(
            qr,
            `SELECT quantity_available FROM inventory
             WHERE dispensary_id = $1 AND variant_id = $2
             FOR UPDATE`,
            [input.dispensaryId, item.variantId],
          );
          const available = invRows[0]
            ? parseFloat(invRows[0].quantity_available)
            : 0;
          if (item.quantity > available) {
            throw new BadRequestException(
              `Insufficient stock: requested ${item.quantity}, only ${Math.floor(available)} available`,
            );
          }
        }
      }

      // Calculate taxes from DB-driven rules
      const { taxTotal, taxBreakdown } = this.calculateTaxes(
        taxRules,
        subtotal,
        resolvedItems.map((ri) => ({
          productTypeCode: ri.productTypeCode,
          totalThcMg: ri.totalThcMg,
        })),
      );

      const total = Math.round((subtotal + taxTotal) * 100) / 100;

      // Create order
      const orderRows = await this.runnerQuery<OrderInsertRow>(
        qr,
        `INSERT INTO orders (
          order_id, dispensary_id, customer_user_id, staff_user_id,
          order_type, order_status, subtotal, discount_total, tax_total, total,
          tax_breakdown, notes, fulfillment_address, scheduled_pickup_at,
          created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'pending',
          $5, 0, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        ) RETURNING order_id AS "orderId", created_at AS "createdAt"`,
        [
          input.dispensaryId,
          input.customerUserId ?? null,
          staffUserId ?? null,
          input.orderType ?? 'in_store',
          subtotal,
          taxTotal,
          total,
          JSON.stringify(taxBreakdown),
          input.notes ?? null,
          input.deliveryAddress ? JSON.stringify(input.deliveryAddress) : null,
          input.scheduledFor ?? null,
        ],
      );
      const order = orderRows[0];

      const stockChanges: ReserveReturningRow[] = [];

      // Insert line items
      for (const item of resolvedItems) {
        await qr.query(
          `INSERT INTO order_line_items (
            line_item_id, order_id, product_id, variant_id,
            quantity, unit_price, discount_applied, tax_applied,
            metrc_item_uid, created_at
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, $6, $7, NOW())`,
          [
            order.orderId,
            item.productId,
            item.variantId,
            item.quantity,
            item.unitPrice,
            Math.round((item.lineTotal / subtotal) * taxTotal * 100) / 100,
            item.metrcItemUid ?? null,
          ],
        );

        // Reserve inventory (pre-validated above). RETURNING surfaces the
        // post-update level + threshold so we can emit inventory.low_stock /
        // inventory.out_of_stock events after commit (sc-113).
        if (item.variantId) {
          const reserveRows = await this.runnerQuery<ReserveReturningRow>(
            qr,
            `UPDATE inventory
             SET quantity_reserved = quantity_reserved + $1,
                 quantity_available = quantity_available - $1,
                 updated_at = NOW()
             WHERE dispensary_id = $2 AND variant_id = $3 AND quantity_available >= $1
             RETURNING inventory_id, variant_id,
                       quantity_available::text AS new_available,
                       (quantity_available + $1)::text AS prev_available,
                       reorder_threshold::text AS reorder_threshold`,
            [item.quantity, input.dispensaryId, item.variantId],
          );
          stockChanges.push(...reserveRows);
        }
      }

      await qr.commitTransaction();

      void this.emitStockChanges(
        stockChanges,
        input.dispensaryId,
        'reserve',
      ).catch(() => undefined);

      // Emit order.created event (async, non-blocking)
      void this.emitOrderEvent(
        order.orderId,
        input.dispensaryId,
        'pending',
      ).catch(() => undefined);

      return {
        orderId: order.orderId,
        dispensaryId: input.dispensaryId,
        orderStatus: 'pending',
        orderType: input.orderType ?? 'in_store',
        subtotal,
        discountTotal: 0,
        taxTotal,
        total,
        taxBreakdown,
        lineItemCount: resolvedItems.length,
        createdAt: order.createdAt,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

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

  async confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    const result: unknown = await this.dataSource.query(
      `UPDATE orders SET order_status = 'confirmed', updated_at = NOW()
       WHERE order_id = $1 AND dispensary_id = $2 AND order_status = 'pending'`,
      [orderId, dispensaryId],
    );
    const updated = dmlRowCount(result) > 0;
    if (updated)
      void this.emitOrderEvent(orderId, dispensaryId, 'confirmed').catch(
        () => undefined,
      );
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
      void this.emitOrderEvent(orderId, dispensaryId, 'preparing').catch(
        () => undefined,
      );
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
      void this.emitOrderEvent(orderId, dispensaryId, 'ready').catch(
        () => undefined,
      );
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
      const orderRows = await this.runnerQuery<CompleteOrderRow>(
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
      const lineItems = await this.runnerQuery<CompleteOrderLineItemRow>(
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
      void this.emitOrderEvent(
        input.orderId,
        input.dispensaryId,
        'completed',
      ).catch(() => undefined);

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
      const orderRows = await this.runnerQuery<CancelOrderRow>(
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

      const lineItems = await this.runnerQuery<CancelLineItemRow>(
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
          const releaseRows = await this.runnerQuery<ReserveReturningRow>(
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

      void this.emitStockChanges(stockChanges, dispensaryId, 'release').catch(
        () => undefined,
      );

      // Notify customer of cancellation
      void this.emitOrderEvent(orderId, dispensaryId, 'cancelled').catch(
        () => undefined,
      );

      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
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
