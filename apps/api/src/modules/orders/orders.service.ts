import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateOrderInput } from './dto/create-order.input';
import { OrderSummary, TaxLineItem } from './dto/order-summary.type';

// NY/NJ/CT cannabis tax rates (as of 2025)
const TAX_RATES: Record<string, { state: number; local: number; excise: number; label: string }[]> = {
  NY: [
    { state: 0.09,   local: 0.04,  excise: 0.0,  label: 'NY State Tax (9%)' },
    { state: 0.0,    local: 0.0,   excise: 0.13, label: 'NY Cannabis Excise (13%)' },
  ],
  NJ: [
    { state: 0.0665, local: 0.02,  excise: 0.0,  label: 'NJ Sales Tax (6.625%)' },
    { state: 0.0,    local: 0.0,   excise: 0.06, label: 'NJ Cannabis Excise (6%)' },
  ],
  CT: [
    { state: 0.0635, local: 0.03,  excise: 0.0,  label: 'CT Sales Tax (6.35%)' },
    { state: 0.0,    local: 0.0,   excise: 0.03, label: 'CT Cannabis Excise (3%)' },
  ],
};

@Injectable()
export class OrdersService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createOrder(input: CreateOrderInput, staffUserId?: string): Promise<OrderSummary> {
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
      const taxRates = TAX_RATES[state] ?? TAX_RATES['NY'];

      // Resolve products and pricing
      let subtotal = 0;
      const resolvedItems: any[] = [];

      for (const item of input.lineItems) {
        // Get product
        const [product] = await qr.query(
          `SELECT id, name, is_active, is_approved, metrc_item_uid, dispensary_id FROM products WHERE id = $1 AND dispensary_id = $2`,
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

        resolvedItems.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          metrcItemUid: product.metrc_item_uid,
        });
      }

      // Calculate taxes
      const taxBreakdown: TaxLineItem[] = [];
      let taxTotal = 0;

      for (const rate of taxRates) {
        const ratePercent = rate.state + rate.local + rate.excise;
        const amount = Math.round(subtotal * ratePercent * 100) / 100;
        taxTotal += amount;
        taxBreakdown.push({ label: rate.label, ratePercent: ratePercent * 100, amount });
      }

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
    return this.dataSource.query(
      `SELECT "orderId", "dispensaryId", "customerUserId", "orderType", "orderStatus",
              subtotal, "taxTotal", total, "createdAt", "updatedAt"
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
    return (result[1] ?? 0) > 0;
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
      return { order, lineItems };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

}
