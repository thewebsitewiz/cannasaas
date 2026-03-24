import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCompletedEvent } from './events/order-completed.event';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateOrderInput } from './dto/create-order.input';
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
   * Fetches active tax rules for a given state from lkp_tax_categories.
   * Returns an empty array (graceful fallback) if no rules exist.
   */
  private async getTaxRulesForState(
    qr: QueryRunner,
    state: string,
  ): Promise<TaxCategoryRow[]> {
    try {
      const rows: TaxCategoryRow[] = await qr.query(
        `SELECT tax_category_id, code, state, name, tax_basis, rate,
                effective_date, statutory_reference, is_active
         FROM lkp_tax_categories
         WHERE state = $1 AND is_active = true
         ORDER BY tax_category_id`,
        [state],
      );
      return rows;
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch tax rules for state=${state}: ${err.message}. Falling back to zero tax.`,
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
    resolvedItems: Array<{ productTypeCode: ProductTypeCode | null; totalThcMg: number }>,
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
        const isGeneralThcExcise = !['FLOWER', 'CONCENTRATE', 'EDIBLE'].includes(codeSuffix);

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

  async createOrder(input: CreateOrderInput, staffUserId?: string): Promise<OrderSummary> {
    // Pre-transaction validation — fail fast before starting a DB transaction
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new BadRequestException('Order must contain at least one line item');
    }

    // Verify all quantities are > 0
    const invalidQty = input.lineItems.find(li => li.quantity <= 0);
    if (invalidQty) {
      throw new BadRequestException(
        `Invalid quantity for product ${invalidQty.productId}: quantity must be greater than 0`,
      );
    }

    // Verify the dispensary exists
    const [dispensaryCheck] = await this.dataSource.query(
      `SELECT entity_id FROM dispensaries WHERE entity_id = $1`,
      [input.dispensaryId],
    );
    if (!dispensaryCheck) {
      throw new BadRequestException(`Dispensary ${input.dispensaryId} does not exist`);
    }

    // Verify all product IDs exist and belong to this dispensary
    const productIds = input.lineItems.map(li => li.productId);
    const existingProducts = await this.dataSource.query(
      `SELECT product_id FROM products WHERE product_id = ANY($1) AND dispensary_id = $2`,
      [productIds, input.dispensaryId],
    );
    const existingProductIds = new Set(existingProducts.map((r: any) => r.product_id));
    const missingProducts = productIds.filter(id => !existingProductIds.has(id));
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
      const [dispensary] = await qr.query(
        `SELECT entity_id, state, is_active FROM dispensaries WHERE entity_id = $1`,
        [input.dispensaryId]
      );
      if (!dispensary) throw new NotFoundException('Dispensary not found');
      if (!dispensary.is_active) throw new BadRequestException('Dispensary is not active');

      const state = dispensary.state as string;

      // Fetch tax rules from DB instead of using hardcoded rates
      const taxRules = await this.getTaxRulesForState(qr, state);
      if (taxRules.length === 0) {
        this.logger.warn(
          `No active tax rules found for state=${state}, dispensary=${input.dispensaryId}. Order will have zero tax.`,
        );
      }

      // Resolve products and pricing
      let subtotal = 0;
      const resolvedItems: any[] = [];

      for (const item of input.lineItems) {
        // Get product with product_type code and THC content for per-mg-THC tax calculation
        const [product] = await qr.query(
          `SELECT p.id, p.name, p.is_active, p.is_approved, p.metrc_item_uid,
                  p.dispensary_id, p.total_thc_mg_per_container,
                  pt.code AS product_type_code
           FROM products p
           LEFT JOIN lkp_product_types pt ON pt.product_type_id = p.product_type_id
           WHERE p.id = $1 AND p.dispensary_id = $2`,
          [item.productId, input.dispensaryId]
        );
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        if (!product.is_active) throw new BadRequestException(`Product "${product.name}" is not active`);

        // Get current price
        let unitPrice = 0;
        if (item.variantId) {
          const [pricing] = await qr.query(
            `SELECT price FROM product_pricing
             WHERE variant_id = $1 AND price_type = 'retail'
             AND effective_from <= NOW()
             AND (effective_until IS NULL OR effective_until > NOW())
             ORDER BY effective_from DESC LIMIT 1`,
            [item.variantId]
          );
          unitPrice = pricing ? parseFloat(pricing.price) : 0;
        } else {
          // Use first active variant price
          const [pricing] = await qr.query(
            `SELECT pp.price FROM product_pricing pp
             JOIN product_variants pv ON pv.variant_id = pp.variant_id
             WHERE pv.product_id = $1 AND pv.dispensary_id = $2 AND pv.is_active = true
             AND pp.price_type = 'retail'
             AND pp.effective_from <= NOW()
             AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
             ORDER BY pv.sort_order ASC, pp.effective_from DESC LIMIT 1`,
            [item.productId, input.dispensaryId]
          );
          unitPrice = pricing ? parseFloat(pricing.price) : 0;
        }

        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        // THC mg for the line item: per-container mg * quantity
        const totalThcMg =
          (parseFloat(product.total_thc_mg_per_container) || 0) * item.quantity;

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
      const [order] = await qr.query(
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
          subtotal, taxTotal, total,
          JSON.stringify(taxBreakdown),
          input.notes ?? null,
        ]
      );

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
          ]
        );

        // Reserve inventory if available
        await qr.query(
          `UPDATE inventory
           SET quantity_reserved = quantity_reserved + $1,
               quantity_available = quantity_available - $1,
               updated_at = NOW()
           WHERE dispensary_id = $2 AND variant_id = $3 AND quantity_available >= $1`,
          [item.quantity, input.dispensaryId, item.variantId]
        );
      }

      await qr.commitTransaction();

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

  async getOrder(orderId: string, dispensaryId: string): Promise<any> {
    const [order] = await this.dataSource.query(
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
      [orderId, dispensaryId]
    );
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  async listOrders(dispensaryId: string, limit = 20, offset = 0): Promise<any[]> {
    // Explicitly select only list-view columns; exclude heavy JSONB fields
    // (tax_breakdown, applied_promotions, metrc_receipt_data) to avoid over-fetching
    return this.dataSource.query(
      `SELECT "orderId", "dispensaryId", "customerUserId", "orderType", "orderStatus",
              subtotal, "taxTotal", total, "paymentMethod", "paymentStatus",
              "createdAt", "updatedAt"
       FROM orders WHERE "dispensaryId" = $1
       ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset]
    );
  }

  async cancelOrder(orderId: string, dispensaryId: string, reason: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE orders SET "orderStatus" = 'cancelled', "cancellationReason" = $1,
       "cancelledAt" = NOW(), "updatedAt" = NOW()
       WHERE "orderId" = $2 AND "dispensaryId" = $3 AND "orderStatus" NOT IN ('completed', 'cancelled')`,
      [reason, orderId, dispensaryId]
    );
    return (result[1] ?? 0) > 0;
  }

  async confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `UPDATE orders SET "orderStatus" = 'confirmed', "updatedAt" = NOW()
       WHERE "orderId" = $1 AND "dispensaryId" = $2 AND "orderStatus" = 'pending'`,
      [orderId, dispensaryId]
    );
    // pg driver returns rowCount as second element for UPDATE
    return Array.isArray(result) && result.length >= 2 ? (result[1] ?? 0) > 0 : (result.rowCount ?? 0) > 0;
  }

  async completeOrder(input: any): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Get order
      const [order] = await qr.query(
        `SELECT "orderId", "dispensaryId", "orderStatus", subtotal, "taxTotal", total, "taxBreakdown",
                "customerUserId", "orderType", "createdAt"
         FROM orders WHERE "orderId" = $1 AND "dispensaryId" = $2`,
        [input.orderId, input.dispensaryId]
      );
      if (!order) throw new Error('Order not found');
      if (order.orderStatus === 'completed') throw new Error('Order already completed');
      if (order.orderStatus === 'cancelled') throw new Error('Cannot complete a cancelled order');

      // Get line items
      const lineItems = await qr.query(
        `SELECT li."lineItemId", li."productId", li."variantId", li.quantity,
                li."unitPrice", li."taxApplied", li."metrcItemUid", li."metrcPackageLabel",
                p.name as product_name
         FROM order_line_items li
         JOIN products p ON p.id = li."productId"
         WHERE li."orderId" = $1`,
        [input.orderId]
      );

      // Update order status
      await qr.query(
        `UPDATE orders SET 
          "orderStatus" = 'completed',
          "metrcReceiptId" = $1,
          "metrcSyncStatus" = 'pending',
          "updatedAt" = NOW()
         WHERE "orderId" = $2`,
        [input.metrcReceiptId ?? null, input.orderId]
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
            [item.quantity, input.dispensaryId, item.variantId]
          );
        }
      }

      await qr.commitTransaction();

      // Fire event — triggers Metrc sale sync via OrderCompletedListener
      this.eventEmitter.emit(
        'order.completed',
        new OrderCompletedEvent(input.orderId, input.dispensaryId, new Date()),
      );

      return { order, lineItems };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

}
