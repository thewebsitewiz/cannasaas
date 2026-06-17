import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderSummary, TaxLineItem } from './dto/order-summary.type';
import {
  OrderEventEmitterService,
  OrderStockEventBridgeService,
  type ReserveReturningRow,
  runnerQuery,
  THC_TAX_CATEGORY_MAP,
} from './order-helpers';
import type {
  DispensaryStateRow,
  InventoryAvailabilityRow,
  OrderInsertRow,
  PricingRow,
  ProductLookupRow,
  ProductTypeCode,
  ResolvedLineItem,
  TaxCategoryRow,
} from './order-types';

/**
 * Owns the `createOrder` mutation — the heaviest path in the orders
 * domain. Resolves products + pricing inside a single transaction,
 * runs `FOR UPDATE` stock checks, computes DB-driven tax, inserts
 * the order + line items + reserves inventory, then post-commit
 * emits stock-change + order-created events.
 *
 * Split out of the original `OrdersService` (tech-debt row #4).
 */
@Injectable()
export class OrderCreatorService {
  private readonly logger = new Logger(OrderCreatorService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly orderEvents: OrderEventEmitterService,
    private readonly stockBridge: OrderStockEventBridgeService,
  ) {}

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
      const dispRows = await runnerQuery<DispensaryStateRow>(
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
        const productRows = await runnerQuery<ProductLookupRow>(
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
          const pricingRows = await runnerQuery<PricingRow>(
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
          const pricingRows = await runnerQuery<PricingRow>(
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
          const invRows = await runnerQuery<InventoryAvailabilityRow>(
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
      const orderRows = await runnerQuery<OrderInsertRow>(
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
          const reserveRows = await runnerQuery<ReserveReturningRow>(
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

      void this.stockBridge
        .emit(stockChanges, input.dispensaryId, 'reserve')
        .catch(() => undefined);

      // Emit order.created event (async, non-blocking)
      void this.orderEvents
        .emit(order.orderId, input.dispensaryId, 'pending')
        .catch(() => undefined);

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

  private async getTaxRulesForState(
    qr: QueryRunner,
    state: string,
  ): Promise<TaxCategoryRow[]> {
    try {
      return await runnerQuery<TaxCategoryRow>(
        qr,
        `SELECT tax_category_id, code, state, name, tax_basis, rate,
                effective_date, statutory_reference, is_active
         FROM lkp_tax_categories
         WHERE state = $1 AND is_active = true
         ORDER BY tax_category_id`,
        [state],
      );
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
}
