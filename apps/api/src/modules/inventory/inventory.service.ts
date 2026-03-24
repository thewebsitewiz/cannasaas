import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ READ ═══

  async findById(inventoryId: string): Promise<any> {
    const [row] = await this.ds.query(
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
    return this.ds.query(
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
    const [row] = await this.ds.query(
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
    const [inv] = await this.ds.query('SELECT * FROM inventory WHERE inventory_id = $1', [inventoryId]);
    if (!inv) throw new NotFoundException('Inventory record not found');

    const before = parseFloat(inv.quantity_on_hand);
    const after = before + delta;
    if (after < 0) throw new BadRequestException('Adjustment would result in negative quantity');

    const newAvailable = after - parseFloat(inv.quantity_reserved);

    await this.ds.query(
      'UPDATE inventory SET quantity_on_hand = $1, quantity_available = $2, updated_at = NOW() WHERE inventory_id = $3',
      [after, newAvailable, inventoryId],
    );

    const [tx] = await this.ds.query(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, notes, reference_order_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [inventoryId, inv.dispensary_id, transactionType, delta, before, after, performedByUserId, notes || null, referenceOrderId || null],
    );

    this.logger.log('Inventory adjusted: ' + inventoryId + ' delta=' + delta + ' (' + transactionType + ')');
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  async reserveStock(inventoryId: string, quantity: number, performedByUserId: string, referenceOrderId?: string): Promise<any> {
    const [inv] = await this.ds.query('SELECT * FROM inventory WHERE inventory_id = $1', [inventoryId]);
    if (!inv) throw new NotFoundException('Inventory record not found');

    const available = parseFloat(inv.quantity_available);
    if (quantity > available) throw new BadRequestException('Not enough available stock. Available: ' + available + ', requested: ' + quantity);

    const newReserved = parseFloat(inv.quantity_reserved) + quantity;
    const newAvailable = available - quantity;

    await this.ds.query(
      'UPDATE inventory SET quantity_reserved = $1, quantity_available = $2, updated_at = NOW() WHERE inventory_id = $3',
      [newReserved, newAvailable, inventoryId],
    );

    const [tx] = await this.ds.query(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'reserve',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [inventoryId, inv.dispensary_id, -quantity, available, newAvailable, performedByUserId, referenceOrderId || null, 'Reserved ' + quantity + ' units'],
    );

    this.logger.log('Stock reserved: ' + inventoryId + ' qty=' + quantity);
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  async releaseReserve(inventoryId: string, quantity: number, performedByUserId: string, referenceOrderId?: string): Promise<any> {
    const [inv] = await this.ds.query('SELECT * FROM inventory WHERE inventory_id = $1', [inventoryId]);
    if (!inv) throw new NotFoundException('Inventory record not found');

    const reserved = parseFloat(inv.quantity_reserved);
    const release = Math.min(quantity, reserved);

    const newReserved = reserved - release;
    const newAvailable = parseFloat(inv.quantity_available) + release;

    await this.ds.query(
      'UPDATE inventory SET quantity_reserved = $1, quantity_available = $2, updated_at = NOW() WHERE inventory_id = $3',
      [newReserved, newAvailable, inventoryId],
    );

    const [tx] = await this.ds.query(
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'release',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [inventoryId, inv.dispensary_id, release, parseFloat(inv.quantity_available), newAvailable, performedByUserId, referenceOrderId || null, 'Released ' + release + ' reserved units'],
    );

    this.logger.log('Reserve released: ' + inventoryId + ' qty=' + release);
    return { inventory: await this.findById(inventoryId), transaction: tx };
  }

  // ═══ REPORTS ═══

  async getLowStock(dispensaryId: string): Promise<any[]> {
    return this.ds.query(
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
    const [result] = await this.ds.query(
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
    return this.ds.query(
      `SELECT transaction_id as "transactionId", inventory_id as "inventoryId",
        dispensary_id as "dispensaryId", transaction_type as "transactionType",
        quantity_delta as "quantityDelta", quantity_before as "quantityBefore", quantity_after as "quantityAfter",
        reference_order_id as "referenceOrderId", performed_by_user_id as "performedByUserId",
        notes, created_at as "createdAt"
      FROM inventory_transactions WHERE inventory_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [inventoryId, limit],
    );
  }
}
