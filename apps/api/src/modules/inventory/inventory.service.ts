import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ READ ═══

  async findById(inventoryId: string): Promise<any> {
    const [row] = await this._q(
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore",
        last_metrc_sync_at as "lastMetrcSyncAt", last_reconciled_at as "lastReconciledAt",
        last_count_at as "lastCountAt", last_count_by_user_id as "lastCountByUserId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE inventory_id = $1`,
      [inventoryId],
    );
    if (!row) throw new NotFoundException('Inventory record not found');
    return row;
  }

  async getByDispensary(dispensaryId: string, limit = 100, offset = 0): Promise<any[]> {
    return this._q(
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", location_in_store as "locationInStore",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE dispensary_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
  }

  async getByVariant(variantId: string, dispensaryId: string): Promise<any> {
    const [row] = await this._q(
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE variant_id = $1 AND dispensary_id = $2`,
      [variantId, dispensaryId],
    );
    return row || null;
  }

  // ═══ ADJUST ═══

  async adjustQuantity(inventoryId: string, delta: number, transactionType: string, performedByUserId: string, notes?: string, referenceOrderId?: string): Promise<any> {
    // Single UPDATE ... RETURNING * instead of SELECT + UPDATE (N+1 fix)
    const [inv] = await this._q(
      `UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + $2,
           quantity_available = quantity_available + $2,
           updated_at = NOW()
       WHERE inventory_id = $1 AND quantity_on_hand + $2 >= 0
       RETURNING *`,
      [inventoryId, delta],
    );
    if (!inv) {
      // Distinguish between not-found and negative-quantity
      const [exists] = await this._q('SELECT 1 FROM inventory WHERE inventory_id = $1', [inventoryId]);
      if (!exists) throw new NotFoundException('Inventory record not found');
      throw new BadRequestException('Adjustment would result in negative quantity');
    }

    const before = parseFloat(inv.quantity_on_hand) - delta;
    const after = parseFloat(inv.quantity_on_hand);

    const [tx] = await this._q(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, notes, reference_order_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [inventoryId, inv.dispensary_id, transactionType, delta, before, after, performedByUserId, notes || null, referenceOrderId || null],
    );

    this.logger.log('Inventory adjusted: ' + inventoryId + ' delta=' + delta + ' (' + transactionType + ')');
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  async reserveStock(inventoryId: string, quantity: number, performedByUserId: string, referenceOrderId?: string): Promise<any> {
    // Single UPDATE ... RETURNING * instead of SELECT + UPDATE (N+1 fix)
    const [inv] = await this._q(
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved + $2,
           quantity_available = quantity_available - $2,
           updated_at = NOW()
       WHERE inventory_id = $1 AND quantity_available >= $2
       RETURNING *`,
      [inventoryId, quantity],
    );
    if (!inv) {
      const [exists] = await this._q('SELECT inventory_id, quantity_available FROM inventory WHERE inventory_id = $1', [inventoryId]);
      if (!exists) throw new NotFoundException('Inventory record not found');
      throw new BadRequestException('Not enough available stock. Available: ' + exists.quantity_available + ', requested: ' + quantity);
    }

    const previousAvailable = parseFloat(inv.quantity_available) + quantity;
    const newAvailable = parseFloat(inv.quantity_available);

    const [tx] = await this._q(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'reserve',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [inventoryId, inv.dispensary_id, -quantity, previousAvailable, newAvailable, performedByUserId, referenceOrderId || null, 'Reserved ' + quantity + ' units'],
    );

    this.logger.log('Stock reserved: ' + inventoryId + ' qty=' + quantity);
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  async releaseReserve(inventoryId: string, quantity: number, performedByUserId: string, referenceOrderId?: string): Promise<any> {
    // Single UPDATE ... RETURNING * instead of SELECT + UPDATE (N+1 fix)
    // Use LEAST to cap release at current reserved amount atomically
    const [inv] = await this._q(
      `WITH pre AS (
        SELECT inventory_id, dispensary_id, quantity_reserved, quantity_available,
               LEAST($2, quantity_reserved) AS release_qty
        FROM inventory WHERE inventory_id = $1
      )
      UPDATE inventory i
       SET quantity_reserved = i.quantity_reserved - pre.release_qty,
           quantity_available = i.quantity_available + pre.release_qty,
           updated_at = NOW()
       FROM pre
       WHERE i.inventory_id = pre.inventory_id
       RETURNING i.*, pre.release_qty, pre.quantity_available AS prev_available`,
      [inventoryId, quantity],
    );
    if (!inv) throw new NotFoundException('Inventory record not found');

    const release = parseFloat(inv.release_qty);
    const previousAvailable = parseFloat(inv.prev_available);
    const newAvailable = parseFloat(inv.quantity_available);

    const [tx] = await this._q(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'release',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [inventoryId, inv.dispensary_id, release, previousAvailable, newAvailable, performedByUserId, referenceOrderId || null, 'Released ' + release + ' reserved units'],
    );

    this.logger.log('Reserve released: ' + inventoryId + ' qty=' + release);
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  // ═══ REPORTS ═══

  async getLowStock(dispensaryId: string): Promise<any[]> {
    return this._q(
      `SELECT inventory_id as "inventoryId", variant_id as "variantId",
        quantity_on_hand as "quantityOnHand", quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore"
      FROM inventory
      WHERE dispensary_id = $1 AND reorder_threshold IS NOT NULL AND quantity_available <= reorder_threshold
      ORDER BY quantity_available ASC`,
      [dispensaryId],
    );
  }

  async getInventoryValue(dispensaryId: string): Promise<any> {
    const [result] = await this._q(
      `SELECT COUNT(*) as "totalItems",
        COALESCE(SUM(quantity_on_hand), 0) as "totalOnHand",
        COALESCE(SUM(quantity_reserved), 0) as "totalReserved",
        COALESCE(SUM(quantity_available), 0) as "totalAvailable"
      FROM inventory WHERE dispensary_id = $1`,
      [dispensaryId],
    );
    return {
      totalItems: parseInt(result.totalItems),
      totalOnHand: parseFloat(result.totalOnHand),
      totalReserved: parseFloat(result.totalReserved),
      totalAvailable: parseFloat(result.totalAvailable),
    };
  }

  async getTransactions(inventoryId: string, limit = 50): Promise<any[]> {
    return this._q(
      `SELECT transaction_id as "transactionId", inventory_id as "inventoryId",
        dispensary_id as "dispensaryId", transaction_type as "transactionType",
        quantity_delta as "quantityDelta", quantity_before as "quantityBefore", quantity_after as "quantityAfter",
        reference_order_id as "referenceOrderId", performed_by_user_id as "performedByUserId",
        notes, created_at as "createdAt"
      FROM inventory_transactions WHERE inventory_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [inventoryId, limit],
    );
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
