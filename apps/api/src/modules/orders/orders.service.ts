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
  ) {}

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
        `SELECT "customerUserId", "orderType", total FROM orders WHERE "orderId" = $1`,
        [orderId],
      );
      const order = rows[0];
      if (!order) return;
      this.eventEmitter.emit(
        status === 'pending' ? 'order.created' : 'order.status_changed',
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
          "orderId", "dispensaryId", "customerUserId", "staffUserId",
          "orderType", "orderStatus", subtotal, "discountTotal", "taxTotal", total,
          "taxBreakdown", notes, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'pending',
          $5, 0, $6, $7, $8, $9, NOW(), NOW()
        ) RETURNING "orderId", "createdAt"`,
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
        ],
      );
      const order = orderRows[0];

      // Insert line items
      for (const item of resolvedItems) {
        await qr.query(
          `INSERT INTO order_line_items (
            "lineItemId", "orderId", "productId", "variantId",
            quantity, "unitPrice", "discountApplied", "taxApplied",
            "metrcItemUid", "createdAt"
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

        // Reserve inventory (pre-validated above)
        await qr.query(
          `UPDATE inventory
           SET quantity_reserved = quantity_reserved + $1,
               quantity_available = quantity_available - $1,
               updated_at = NOW()
           WHERE dispensary_id = $2 AND variant_id = $3 AND quantity_available >= $1`,
          [item.quantity, input.dispensaryId, item.variantId],
        );
      }

      await qr.commitTransaction();

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
      `SELECT o.*,
        json_agg(json_build_object(
          'lineItemId', li."lineItemId",
          'productId', li."productId",
          'variantId', li."variantId",
          'quantity', li.quantity,
          'unitPrice', li."unitPrice",
          'taxApplied', li."taxApplied",
          'metrcItemUid', li."metrcItemUid"
        )) as line_items
       FROM orders o
       LEFT JOIN order_line_items li ON li."orderId" = o."orderId"
       WHERE o."orderId" = $1 AND o."dispensaryId" = $2
       GROUP BY o."orderId"`,
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
      `SELECT "orderId", "dispensaryId", "customerUserId", "orderType", "orderStatus",
              subtotal, "taxTotal", total, payment_method as "paymentMethod",
              "createdAt", "updatedAt"
       FROM orders WHERE "dispensaryId" = $1
       ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
  }

  async confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    const result: unknown = await this.dataSource.query(
      `UPDATE orders SET "orderStatus" = 'confirmed', "updatedAt" = NOW()
       WHERE "orderId" = $1 AND "dispensaryId" = $2 AND "orderStatus" = 'pending'`,
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
      `UPDATE orders SET "orderStatus" = 'preparing', "updatedAt" = NOW()
       WHERE "orderId" = $1 AND "dispensaryId" = $2 AND "orderStatus" = 'confirmed'`,
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
      `UPDATE orders SET "orderStatus" = 'ready', "updatedAt" = NOW()
       WHERE "orderId" = $1 AND "dispensaryId" = $2 AND "orderStatus" = 'preparing'`,
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
        `SELECT "orderId", "dispensaryId", "orderStatus", subtotal, "taxTotal", total, "taxBreakdown",
                "customerUserId", "orderType", "createdAt"
         FROM orders WHERE "orderId" = $1 AND "dispensaryId" = $2`,
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
        `SELECT li."lineItemId", li."productId", li."variantId", li.quantity,
                li."unitPrice", li."taxApplied", li."metrcItemUid", li."metrcPackageLabel",
                p.name as product_name
         FROM order_line_items li
         JOIN products p ON p.id = li."productId"
         WHERE li."orderId" = $1`,
        [input.orderId],
      );

      // Update order status
      await qr.query(
        `UPDATE orders SET
          "orderStatus" = 'completed',
          "metrcReceiptId" = $1,
          "metrcSyncStatus" = 'pending',
          "updatedAt" = NOW()
         WHERE "orderId" = $2`,
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
        'order.completed',
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
        `SELECT "orderId", "orderStatus"
         FROM orders
         WHERE "orderId" = $1 AND "dispensaryId" = $2
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
        `SELECT "variantId", quantity
         FROM order_line_items
         WHERE "orderId" = $1`,
        [orderId],
      );

      for (const item of lineItems) {
        if (item.variantId) {
          await qr.query(
            `UPDATE inventory
             SET quantity_reserved = GREATEST(quantity_reserved - $1, 0),
                 quantity_available = quantity_available + $1,
                 updated_at = NOW()
             WHERE dispensary_id = $2 AND variant_id = $3`,
            [item.quantity, dispensaryId, item.variantId],
          );
        }
      }

      await qr.query(
        `UPDATE orders
         SET "orderStatus" = 'cancelled',
             "cancellationReason" = $1,
             "cancelledAt" = NOW(),
             "updatedAt" = NOW()
         WHERE "orderId" = $2`,
        [reason, orderId],
      );

      await qr.commitTransaction();

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
      statusFilter = `AND "orderStatus" = $4`;
      params.push(status);
    }

    return this.dataSource.query(
      `SELECT "orderId", "dispensaryId", "orderType", "orderStatus",
            subtotal, "taxTotal", total, payment_method as "paymentMethod",
            "createdAt", "updatedAt"
     FROM orders
     WHERE "customerUserId" = $1 ${statusFilter}
     ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
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
         o."orderId", o."orderType", o."orderStatus",
         o.subtotal, o."taxTotal", o.total,
         o.payment_method AS "paymentMethod",
         o."createdAt", o."updatedAt",
         COALESCE(
           json_agg(
             json_build_object(
               'productId', li."productId",
               'variantId', li."variantId",
               'productName', p.name,
               'variantName', pv.name,
               'quantity', li.quantity,
               'price', li."unitPrice"
             ) ORDER BY li."createdAt"
           ) FILTER (WHERE li."lineItemId" IS NOT NULL),
           '[]'::json
         ) AS "lineItems"
       FROM orders o
       LEFT JOIN order_line_items li ON li."orderId" = o."orderId"
       LEFT JOIN products p           ON p.id        = li."productId"
       LEFT JOIN product_variants pv  ON pv.variant_id = li."variantId"
       WHERE o."customerUserId" = $1 AND o."dispensaryId" = $2
       GROUP BY o."orderId"
       ORDER BY o."createdAt" DESC
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
         li."productId" AS "productId",
         li."variantId" AS "variantId",
         p.name           AS "productName",
         pv.name          AS "variantName",
         (array_agg(li."unitPrice" ORDER BY o."createdAt" DESC))[1] AS price,
         COUNT(DISTINCT li."orderId")::int AS "orderCount"
       FROM order_line_items li
       JOIN orders o ON o."orderId" = li."orderId"
       LEFT JOIN products p          ON p.id = li."productId"
       LEFT JOIN product_variants pv ON pv.variant_id = li."variantId"
       WHERE o."customerUserId" = $1
         AND o."dispensaryId"   = $2
         AND o."orderStatus"   != 'cancelled'
       GROUP BY li."productId", li."variantId", p.name, pv.name
       ORDER BY "orderCount" DESC, MAX(o."createdAt") DESC
       LIMIT $3`,
      [customerUserId, dispensaryId, limit],
    );
  }
}
