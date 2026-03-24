import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCompletedEvent } from './events/order-completed.event';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../../database/schema';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderSummary, TaxLineItem } from './dto/order-summary.type';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

/** Row shape returned from lkp_tax_categories */
interface TaxCategoryRow {
  tax_category_id: number;
  code: string;
  state: string;
  name: string;
  tax_basis: 'retail_price' | 'per_mg_thc' | 'wholesale_price';
  rate: string;
  effective_date: string;
  statutory_reference: string;
  is_active: boolean;
}

/** Product type code from lkp_product_types */
type ProductTypeCode = string;

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
    @Inject(DRIZZLE) private db: DB,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getTaxRulesForState(
    db: DB,
    state: string,
  ): Promise<TaxCategoryRow[]> {
    try {
      const rows = await db.execute(sql`
        SELECT tax_category_id, code, state, name, tax_basis, rate,
               effective_date, statutory_reference, is_active
        FROM lkp_tax_categories
        WHERE state = ${state} AND is_active = true
        ORDER BY tax_category_id
      `);
      return rows.rows as TaxCategoryRow[];
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch tax rules for state=${state}: ${err.message}. Falling back to zero tax.`,
      );
      return [];
    }
  }

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
        const codeSuffix = rule.code.split('_').pop()?.toUpperCase() ?? '';
        const isGeneralThcExcise = !['FLOWER', 'CONCENTRATE', 'EDIBLE'].includes(codeSuffix);

        let applicableThcMg = 0;
        for (const item of resolvedItems) {
          const mappedCategory = item.productTypeCode
            ? THC_TAX_CATEGORY_MAP[item.productTypeCode]
            : null;

          if (isGeneralThcExcise) {
            applicableThcMg += item.totalThcMg;
          } else if (mappedCategory === codeSuffix) {
            applicableThcMg += item.totalThcMg;
          }
        }

        amount = Math.round(applicableThcMg * rate * 100) / 100;
      } else {
        amount = Math.round(subtotal * rate * 100) / 100;
      }

      if (amount > 0) {
        taxTotal += amount;
        const ratePercent =
          rule.tax_basis === 'per_mg_thc'
            ? rate
            : rate * 100;
        taxBreakdown.push({ label: rule.name, ratePercent, amount });
      }
    }

    return { taxTotal: Math.round(taxTotal * 100) / 100, taxBreakdown };
  }

  async createOrder(input: CreateOrderInput, staffUserId?: string): Promise<OrderSummary> {
    if (!input.lineItems || input.lineItems.length === 0) {
      throw new BadRequestException('Order must contain at least one line item');
    }

    const invalidQty = input.lineItems.find(li => li.quantity <= 0);
    if (invalidQty) {
      throw new BadRequestException(
        `Invalid quantity for product ${invalidQty.productId}: quantity must be greater than 0`,
      );
    }

    // Verify dispensary exists
    const dispensaryCheck = await this.db.execute(
      sql`SELECT entity_id FROM dispensaries WHERE entity_id = ${input.dispensaryId}`,
    );
    if (dispensaryCheck.rows.length === 0) {
      throw new BadRequestException(`Dispensary ${input.dispensaryId} does not exist`);
    }

    // Verify all product IDs exist and belong to this dispensary
    const productIds = input.lineItems.map(li => li.productId);
    const existingProducts = await this.db.execute(
      sql`SELECT product_id FROM products WHERE product_id = ANY(${productIds}) AND dispensary_id = ${input.dispensaryId}`,
    );
    const existingProductIds = new Set(existingProducts.rows.map((r: any) => r.product_id));
    const missingProducts = productIds.filter(id => !existingProductIds.has(id));
    if (missingProducts.length > 0) {
      throw new BadRequestException(
        `Products not found in this dispensary: ${missingProducts.join(', ')}`,
      );
    }

    return this.db.transaction(async (tx) => {
      // Get dispensary state for tax calculation
      const dispResult = await tx.execute(
        sql`SELECT entity_id, state, is_active FROM dispensaries WHERE entity_id = ${input.dispensaryId}`,
      );
      const dispensary = dispResult.rows[0] as any;
      if (!dispensary) throw new NotFoundException('Dispensary not found');
      if (!dispensary.is_active) throw new BadRequestException('Dispensary is not active');

      const state = dispensary.state as string;

      const taxRules = await this.getTaxRulesForState(tx as unknown as DB, state);
      if (taxRules.length === 0) {
        this.logger.warn(
          `No active tax rules found for state=${state}, dispensary=${input.dispensaryId}. Order will have zero tax.`,
        );
      }

      let subtotal = 0;
      const resolvedItems: any[] = [];

      for (const item of input.lineItems) {
        const productResult = await tx.execute(sql`
          SELECT p.id, p.name, p.is_active, p.is_approved, p.metrc_item_uid,
                 p.dispensary_id, p.total_thc_mg_per_container,
                 pt.code AS product_type_code
          FROM products p
          LEFT JOIN lkp_product_types pt ON pt.product_type_id = p.product_type_id
          WHERE p.id = ${item.productId} AND p.dispensary_id = ${input.dispensaryId}
        `);
        const product = productResult.rows[0] as any;
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        if (!product.is_active) throw new BadRequestException(`Product "${product.name}" is not active`);

        let unitPrice = 0;
        if (item.variantId) {
          const pricingResult = await tx.execute(sql`
            SELECT price FROM product_pricing
            WHERE variant_id = ${item.variantId} AND price_type = 'retail'
            AND effective_from <= NOW()
            AND (effective_until IS NULL OR effective_until > NOW())
            ORDER BY effective_from DESC LIMIT 1
          `);
          const pricing = pricingResult.rows[0] as any;
          unitPrice = pricing ? parseFloat(pricing.price) : 0;
        } else {
          const pricingResult = await tx.execute(sql`
            SELECT pp.price FROM product_pricing pp
            JOIN product_variants pv ON pv.variant_id = pp.variant_id
            WHERE pv.product_id = ${item.productId} AND pv.dispensary_id = ${input.dispensaryId} AND pv.is_active = true
            AND pp.price_type = 'retail'
            AND pp.effective_from <= NOW()
            AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
            ORDER BY pv.sort_order ASC, pp.effective_from DESC LIMIT 1
          `);
          const pricing = pricingResult.rows[0] as any;
          unitPrice = pricing ? parseFloat(pricing.price) : 0;
        }

        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

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

      const { taxTotal, taxBreakdown } = this.calculateTaxes(
        taxRules,
        subtotal,
        resolvedItems.map((ri) => ({
          productTypeCode: ri.productTypeCode,
          totalThcMg: ri.totalThcMg,
        })),
      );

      const total = Math.round((subtotal + taxTotal) * 100) / 100;

      const orderResult = await tx.execute(sql`
        INSERT INTO orders (
          "orderId", "dispensaryId", "customerUserId", "staffUserId",
          "orderType", "orderStatus", subtotal, "discountTotal", "taxTotal", total,
          "taxBreakdown", notes, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${input.dispensaryId}, ${input.customerUserId ?? null}, ${staffUserId ?? null},
          ${input.orderType ?? 'in_store'}, 'pending',
          ${subtotal}, 0, ${taxTotal}, ${total},
          ${JSON.stringify(taxBreakdown)}, ${input.notes ?? null}, NOW(), NOW()
        ) RETURNING "orderId", "createdAt"
      `);
      const order = orderResult.rows[0] as any;

      for (const item of resolvedItems) {
        await tx.execute(sql`
          INSERT INTO order_line_items (
            "lineItemId", "orderId", "productId", "variantId",
            quantity, "unitPrice", "discountApplied", "taxApplied",
            "metrcItemUid", "createdAt"
          ) VALUES (
            gen_random_uuid(), ${order.orderId}, ${item.productId}, ${item.variantId},
            ${item.quantity}, ${item.unitPrice}, 0,
            ${Math.round((item.lineTotal / subtotal) * taxTotal * 100) / 100},
            ${item.metrcItemUid ?? null}, NOW()
          )
        `);

        await tx.execute(sql`
          UPDATE inventory
          SET quantity_reserved = quantity_reserved + ${item.quantity},
              quantity_available = quantity_available - ${item.quantity},
              updated_at = NOW()
          WHERE dispensary_id = ${input.dispensaryId} AND variant_id = ${item.variantId} AND quantity_available >= ${item.quantity}
        `);
      }

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
    });
  }

  async getOrder(orderId: string, dispensaryId: string): Promise<any> {
    const result = await this.db.execute(sql`
      SELECT o.*,
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
      WHERE o."orderId" = ${orderId} AND o."dispensaryId" = ${dispensaryId}
      GROUP BY o."orderId"
    `);
    const order = result.rows[0];
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }

  async listOrders(dispensaryId: string, limit = 20, offset = 0): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT "orderId", "dispensaryId", "customerUserId", "orderType", "orderStatus",
             subtotal, "taxTotal", total, "paymentMethod", "paymentStatus",
             "createdAt", "updatedAt"
      FROM orders WHERE "dispensaryId" = ${dispensaryId}
      ORDER BY "createdAt" DESC LIMIT ${limit} OFFSET ${offset}
    `);
    return result.rows as any[];
  }

  async cancelOrder(orderId: string, dispensaryId: string, reason: string): Promise<boolean> {
    const result = await this.db.execute(sql`
      UPDATE orders SET "orderStatus" = 'cancelled', "cancellationReason" = ${reason},
      "cancelledAt" = NOW(), "updatedAt" = NOW()
      WHERE "orderId" = ${orderId} AND "dispensaryId" = ${dispensaryId} AND "orderStatus" NOT IN ('completed', 'cancelled')
    `);
    return (result.rowCount ?? 0) > 0;
  }

  async confirmOrder(orderId: string, dispensaryId: string): Promise<boolean> {
    const result = await this.db.execute(sql`
      UPDATE orders SET "orderStatus" = 'confirmed', "updatedAt" = NOW()
      WHERE "orderId" = ${orderId} AND "dispensaryId" = ${dispensaryId} AND "orderStatus" = 'pending'
    `);
    return (result.rowCount ?? 0) > 0;
  }

  async completeOrder(input: any): Promise<any> {
    const result = await this.db.transaction(async (tx) => {
      const orderResult = await tx.execute(sql`
        SELECT "orderId", "dispensaryId", "orderStatus", subtotal, "taxTotal", total, "taxBreakdown",
               "customerUserId", "orderType", "createdAt"
        FROM orders WHERE "orderId" = ${input.orderId} AND "dispensaryId" = ${input.dispensaryId}
      `);
      const order = orderResult.rows[0] as any;
      if (!order) throw new Error('Order not found');
      if (order.orderStatus === 'completed') throw new Error('Order already completed');
      if (order.orderStatus === 'cancelled') throw new Error('Cannot complete a cancelled order');

      const lineItemsResult = await tx.execute(sql`
        SELECT li."lineItemId", li."productId", li."variantId", li.quantity,
               li."unitPrice", li."taxApplied", li."metrcItemUid", li."metrcPackageLabel",
               p.name as product_name
        FROM order_line_items li
        JOIN products p ON p.id = li."productId"
        WHERE li."orderId" = ${input.orderId}
      `);
      const lineItems = lineItemsResult.rows as any[];

      await tx.execute(sql`
        UPDATE orders SET
          "orderStatus" = 'completed',
          "metrcReceiptId" = ${input.metrcReceiptId ?? null},
          "metrcSyncStatus" = 'pending',
          "updatedAt" = NOW()
        WHERE "orderId" = ${input.orderId}
      `);

      for (const item of lineItems) {
        if (item.variantId) {
          await tx.execute(sql`
            UPDATE inventory
            SET quantity_on_hand = quantity_on_hand - ${item.quantity},
                quantity_reserved = quantity_reserved - ${item.quantity},
                updated_at = NOW()
            WHERE dispensary_id = ${input.dispensaryId} AND variant_id = ${item.variantId} AND quantity_on_hand >= ${item.quantity}
          `);
        }
      }

      return { order, lineItems };
    });

    this.eventEmitter.emit(
      'order.completed',
      new OrderCompletedEvent(input.orderId, input.dispensaryId, new Date()),
    );

    return result;
  }
}
