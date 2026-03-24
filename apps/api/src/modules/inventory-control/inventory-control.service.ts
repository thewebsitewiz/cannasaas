import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventoryTransfer, InventoryTransferItem } from './entities/inventory-control.entity';
import { InventoryCount, InventoryCountItem } from './entities/inventory-control.entity';
import { InventoryAdjustment, LkpAdjustmentReason } from './entities/inventory-control.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class InventoryControlService {
  private readonly logger = new Logger(InventoryControlService.name);

  constructor(
    @Inject(DRIZZLE) private db: any
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSFERS
  // ═══════════════════════════════════════════════════════════════════════════

  async createTransfer(input: { organizationId: string; fromDispensaryId: string; toDispensaryId: string; requestedByUserId: string; notes?: string; items: Array<{ variantId: string; quantity: number }> }): Promise<InventoryTransfer> {
    if (input.fromDispensaryId === input.toDispensaryId) throw new BadRequestException('Cannot transfer to the same dispensary');

    // Verify same org
    const dispensaries = await this._q(
      `SELECT d.entity_id, c.organization_id FROM dispensaries d JOIN companies c ON c.company_id = d.company_id WHERE d.entity_id IN ($1, $2)`,
      [input.fromDispensaryId, input.toDispensaryId],
    );
    const orgIds = [...new Set(dispensaries.map((d: any) => d.organization_id))];
    if (orgIds.length !== 1) throw new BadRequestException('Dispensaries must belong to the same organization');

    const qr = this.db.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const transfer = this.transferRepo.create({
        organization_id: orgIds[0] as string,
        from_dispensary_id: input.fromDispensaryId,
        to_dispensary_id: input.toDispensaryId,
        requested_by_user_id: input.requestedByUserId,
        notes: input.notes,
        status: 'requested',
      });
      const saved = await qr.manager.save(InventoryTransfer, transfer) as InventoryTransfer;

      for (const item of input.items) {
        const [inv] = await qr.query(
          `SELECT i.quantity_available, p.name as product_name, pv.name as variant_name
           FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id
           JOIN products p ON p.id = pv.product_id WHERE i.variant_id = $1 AND i.dispensary_id = $2`,
          [item.variantId, input.fromDispensaryId],
        );
        if (!inv) throw new BadRequestException(`Variant ${item.variantId} not found in source dispensary`);
        if (inv.quantity_available < item.quantity) throw new BadRequestException(`Insufficient stock for ${inv.product_name}: ${inv.quantity_available} available, ${item.quantity} requested`);

        await qr.manager.save(this.transferItemRepo.create({
          transfer_id: saved.transferId,
          variant_id: item.variantId,
          product_name: inv.product_name,
          variant_name: inv.variant_name,
          quantity_requested: item.quantity,
        }));
      }

      await qr.commitTransaction();
      this.logger.log(`Transfer created: ${saved.transferId} (${input.items.length} items)`);
      return saved;
    } catch (err) { await qr.rollbackTransaction(); throw err; }
    finally { await qr.release(); }
  }

  async approveTransfer(transferId: string, userId: string): Promise<InventoryTransfer> {
    const transfer = await this.transferRepo.findOne({ where: { transferId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'requested') throw new BadRequestException(`Cannot approve transfer in ${transfer.status} status`);
    transfer.status = 'approved';
    transfer.approved_by_user_id = userId;
    transfer.approved_at = new Date();
    return this.transferRepo.save(transfer);
  }

  async shipTransfer(transferId: string): Promise<InventoryTransfer> {
    const qr = this.db.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const transfer = await qr.manager.findOne(InventoryTransfer, { where: { transferId } });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'approved') throw new BadRequestException('Transfer must be approved first');

      const items = await qr.manager.find(InventoryTransferItem, { where: { transfer_id: transferId } });
      for (const item of items) {
        await qr.query(
          `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, quantity_available = quantity_available - $1, last_movement_at = NOW(), updated_at = NOW()
           WHERE variant_id = $2 AND dispensary_id = $3 AND quantity_available >= $1`,
          [item.quantity_requested, item.variant_id, transfer.from_dispensary_id],
        );
        item.quantity_shipped = item.quantity_requested;
        await qr.manager.save(item);
      }

      transfer.status = 'in_transit';
      transfer.shipped_at = new Date();
      const saved = await qr.manager.save(InventoryTransfer, transfer) as InventoryTransfer;
      await qr.commitTransaction();
      this.logger.log(`Transfer shipped: ${transferId}`);
      return saved;
    } catch (err) { await qr.rollbackTransaction(); throw err; }
    finally { await qr.release(); }
  }

  async receiveTransfer(transferId: string, receivedItems: Array<{ itemId: string; quantityReceived: number; notes?: string }>): Promise<InventoryTransfer> {
    const qr = this.db.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const transfer = await qr.manager.findOne(InventoryTransfer, { where: { transferId } });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'in_transit') throw new BadRequestException('Transfer must be in transit');

      for (const ri of receivedItems) {
        const item = await qr.manager.findOne(InventoryTransferItem, { where: { itemId: ri.itemId } });
        if (!item) continue;
        item.quantity_received = ri.quantityReceived;
        if (ri.notes) item.notes = ri.notes;
        await qr.manager.save(item);

        // Add to destination inventory
        const [existing] = await qr.query(
          `SELECT inventory_id FROM inventory WHERE variant_id = $1 AND dispensary_id = $2`,
          [item.variant_id, transfer.to_dispensary_id],
        );
        if (existing) {
          await qr.query(
            `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, quantity_available = quantity_available + $1, last_movement_at = NOW(), updated_at = NOW()
             WHERE inventory_id = $2`, [ri.quantityReceived, existing.inventory_id],
          );
        } else {
          await qr.query(
            `INSERT INTO inventory (inventory_id, variant_id, dispensary_id, quantity_on_hand, quantity_available, last_movement_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $3, NOW())`,
            [item.variant_id, transfer.to_dispensary_id, ri.quantityReceived],
          );
        }
      }

      transfer.status = 'completed';
      transfer.received_at = new Date();
      const saved = await qr.manager.save(InventoryTransfer, transfer) as InventoryTransfer;
      await qr.commitTransaction();
      this.logger.log(`Transfer received: ${transferId}`);
      return saved;
    } catch (err) { await qr.rollbackTransaction(); throw err; }
    finally { await qr.release(); }
  }

  async rejectTransfer(transferId: string, userId: string, reason: string): Promise<InventoryTransfer> {
    const transfer = await this.transferRepo.findOne({ where: { transferId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    transfer.status = 'rejected';
    transfer.approved_by_user_id = userId;
    transfer.rejection_reason = reason;
    return this.transferRepo.save(transfer);
  }

  async getTransfers(dispensaryId: string, direction?: string): Promise<any[]> {
    const where = direction === 'outgoing' ? 'it.from_dispensary_id = $1'
      : direction === 'incoming' ? 'it.to_dispensary_id = $1'
      : '(it.from_dispensary_id = $1 OR it.to_dispensary_id = $1)';
    return this._q(
      `SELECT it.*, df.name as from_name, dt.name as to_name,
        u."firstName" || ' ' || u."lastName" as requested_by,
        (SELECT COUNT(*) FROM inventory_transfer_items iti WHERE iti.transfer_id = it.transfer_id) as item_count,
        (SELECT SUM(iti.quantity_requested) FROM inventory_transfer_items iti WHERE iti.transfer_id = it.transfer_id) as total_units
       FROM inventory_transfers it
       JOIN dispensaries df ON df.entity_id = it.from_dispensary_id
       JOIN dispensaries dt ON dt.entity_id = it.to_dispensary_id
       JOIN users u ON u.id = it.requested_by_user_id
       WHERE ${where} ORDER BY it.created_at DESC`, [dispensaryId],
    );
  }

  async getTransferItems(transferId: string): Promise<InventoryTransferItem[]> {
    return this.transferItemRepo.find({ where: { transfer_id: transferId } });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICAL COUNTS
  // ═══════════════════════════════════════════════════════════════════════════

  async startCount(dispensaryId: string, userId: string, countType: string, notes?: string): Promise<InventoryCount> {
    const items = await this._q(
      `SELECT i.variant_id, i.quantity_on_hand, p.name as product_name, pv.name as variant_name
       FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1 ORDER BY p.name`, [dispensaryId],
    );

    const count = this.countRepo.create({
      dispensary_id: dispensaryId, count_type: countType,
      started_by_user_id: userId, started_at: new Date(),
      total_items: items.length, notes,
    });
    const saved = await this.countRepo.save(count);

    for (const item of items) {
      await this.countItemRepo.save(this.countItemRepo.create({
        count_id: saved.countId, variant_id: item.variant_id,
        product_name: item.product_name, variant_name: item.variant_name,
        expected_quantity: item.quantity_on_hand,
      }));
    }

    this.logger.log(`Count started: ${saved.countId} (${items.length} items)`);
    return saved;
  }

  async recordCount(countItemId: string, countedQuantity: number, userId: string, notes?: string): Promise<InventoryCountItem> {
    const item = await this.countItemRepo.findOne({ where: { countItemId } });
    if (!item) throw new NotFoundException('Count item not found');
    item.counted_quantity = countedQuantity;
    item.counted_by_user_id = userId;
    item.counted_at = new Date();
    if (notes) item.notes = notes;

    const saved = await this.countItemRepo.save(item);

    // Update count progress
    await this._q(
      `UPDATE inventory_counts SET
        items_counted = (SELECT COUNT(*) FROM inventory_count_items WHERE count_id = $1 AND counted_quantity IS NOT NULL),
        variance_count = (SELECT COUNT(*) FROM inventory_count_items WHERE count_id = $1 AND counted_quantity IS NOT NULL AND counted_quantity != expected_quantity),
        updated_at = NOW()
       WHERE count_id = $1`, [item.count_id],
    );

    return saved;
  }

  async completeCount(countId: string, userId: string, autoAdjust: boolean): Promise<InventoryCount> {
    const count = await this.countRepo.findOne({ where: { countId } });
    if (!count) throw new NotFoundException('Count not found');

    const uncounted = await this._q(
      `SELECT COUNT(*) as c FROM inventory_count_items WHERE count_id = $1 AND counted_quantity IS NULL`, [countId],
    );
    if (parseInt(uncounted[0].c) > 0) throw new BadRequestException(`${uncounted[0].c} items still uncounted`);

    if (autoAdjust) {
      const variances = await this._q(
        `SELECT * FROM inventory_count_items WHERE count_id = $1 AND counted_quantity != expected_quantity`, [countId],
      );
      for (const v of variances) {
        const change = v.counted_quantity - v.expected_quantity;
        await this.createAdjustment({
          dispensaryId: count.dispensary_id, variantId: v.variant_id,
          reasonCode: 'miscount', quantityChange: change,
          submittedByUserId: userId, notes: `Auto-adjusted from count ${countId}`,
          countId,
        });
      }
    }

    count.status = 'completed';
    count.completed_by_user_id = userId;
    count.completed_at = new Date();
    return this.countRepo.save(count);
  }

  async getCountItems(countId: string): Promise<InventoryCountItem[]> {
    return this.countItemRepo.find({ where: { count_id: countId }, order: { product_name: 'ASC' } });
  }

  async getVarianceReport(countId: string): Promise<any[]> {
    return this._q(
      `SELECT ci.*, ABS(ci.variance) as abs_variance,
        CASE WHEN ci.expected_quantity > 0 THEN ROUND(ci.variance::DECIMAL / ci.expected_quantity * 100, 1) ELSE 0 END as variance_pct
       FROM inventory_count_items ci WHERE ci.count_id = $1 AND ci.variance != 0
       ORDER BY ABS(ci.variance) DESC`, [countId],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADJUSTMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async createAdjustment(input: { dispensaryId: string; variantId: string; reasonCode: string; quantityChange: number; submittedByUserId: string; notes?: string; countId?: string }): Promise<InventoryAdjustment> {
    const [reason] = await this._q(`SELECT * FROM lkp_adjustment_reasons WHERE code = $1`, [input.reasonCode]);
    if (!reason) throw new BadRequestException(`Invalid reason code: ${input.reasonCode}`);

    const [inv] = await this._q(
      `SELECT i.quantity_on_hand, p.name as product_name FROM inventory i
       JOIN product_variants pv ON pv.variant_id = i.variant_id JOIN products p ON p.id = pv.product_id
       WHERE i.variant_id = $1 AND i.dispensary_id = $2`,
      [input.variantId, input.dispensaryId],
    );
    if (!inv) throw new NotFoundException('Inventory not found');

    const qtyBefore = parseInt(inv.quantity_on_hand);
    const qtyAfter = qtyBefore + input.quantityChange;
    if (qtyAfter < 0) throw new BadRequestException(`Adjustment would result in negative inventory (${qtyBefore} + ${input.quantityChange} = ${qtyAfter})`);

    const autoApprove = !reason.requires_approval;

    const adj = this.adjustRepo.create({
      dispensary_id: input.dispensaryId, variant_id: input.variantId,
      product_name: inv.product_name, reason_id: reason.reason_id,
      quantity_change: input.quantityChange, quantity_before: qtyBefore, quantity_after: qtyAfter,
      submitted_by_user_id: input.submittedByUserId, notes: input.notes,
      status: autoApprove ? 'approved' : 'pending',
    });
    const saved = await this.adjustRepo.save(adj);

    if (autoApprove) {
      await this._q(
        `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, quantity_available = quantity_available + $1, last_movement_at = NOW(), updated_at = NOW()
         WHERE variant_id = $2 AND dispensary_id = $3`,
        [input.quantityChange, input.variantId, input.dispensaryId],
      );
    }

    this.logger.log(`Adjustment ${saved.adjustmentId}: ${inv.product_name} ${input.quantityChange > 0 ? '+' : ''}${input.quantityChange} (${input.reasonCode}) — ${autoApprove ? 'auto-approved' : 'pending approval'}`);
    return saved;
  }

  async approveAdjustment(adjustmentId: string, userId: string): Promise<InventoryAdjustment> {
    const adj = await this.adjustRepo.findOne({ where: { adjustmentId } });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'pending') throw new BadRequestException('Already processed');

    await this._q(
      `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, quantity_available = quantity_available + $1, last_movement_at = NOW(), updated_at = NOW()
       WHERE variant_id = $2 AND dispensary_id = $3`,
      [adj.quantity_change, adj.variant_id, adj.dispensary_id],
    );

    adj.status = 'approved';
    adj.approved_by_user_id = userId;
    adj.approved_at = new Date();
    return this.adjustRepo.save(adj);
  }

  async getAdjustments(dispensaryId: string, limit = 50): Promise<any[]> {
    return this._q(
      `SELECT ia.*, lr.name as reason_name, lr.code as reason_code,
        u."firstName" || ' ' || u."lastName" as submitted_by
       FROM inventory_adjustments ia
       JOIN lkp_adjustment_reasons lr ON lr.reason_id = ia.reason_id
       JOIN users u ON u.id = ia.submitted_by_user_id
       WHERE ia.dispensary_id = $1 ORDER BY ia.created_at DESC LIMIT $2`,
      [dispensaryId, limit],
    );
  }

  async getAdjustmentReasons(): Promise<LkpAdjustmentReason[]> {
    return this._q(`SELECT reason_id as "reasonId", code, name, direction, requires_approval as "requiresApproval", is_active as "isActive" FROM lkp_adjustment_reasons WHERE is_active = true ORDER BY reason_id`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTS: EXPIRATION, REORDER, DEAD STOCK
  // ═══════════════════════════════════════════════════════════════════════════

  async getExpiringInventory(dispensaryId: string, daysAhead = 30): Promise<any[]> {
    return this._q(
      `SELECT i.inventory_id, i.variant_id, i.quantity_on_hand, i.expiration_date, i.lot_number,
        p.name as product_name, pv.name as variant_name,
        i.expiration_date - CURRENT_DATE as days_until_expiry,
        CASE WHEN i.expiration_date < CURRENT_DATE THEN 'expired' ELSE 'expiring' END as alert_type
       FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1 AND i.expiration_date IS NOT NULL AND i.expiration_date <= CURRENT_DATE + INTERVAL '1 day' * $2
       ORDER BY i.expiration_date ASC`,
      [dispensaryId, daysAhead],
    );
  }

  async getReorderAlerts(dispensaryId: string): Promise<any[]> {
    return this._q(
      `SELECT i.inventory_id, i.variant_id, i.quantity_on_hand, i.quantity_available,
        i.reorder_threshold, i.reorder_quantity, i.auto_reorder_enabled,
        p.name as product_name, pv.name as variant_name
       FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1 AND i.reorder_threshold IS NOT NULL
         AND i.quantity_available <= i.reorder_threshold
       ORDER BY i.quantity_available ASC`,
      [dispensaryId],
    );
  }

  async getDeadStock(dispensaryId: string, daysSinceMovement = 30): Promise<any[]> {
    return this._q(
      `SELECT i.inventory_id, i.variant_id, i.quantity_on_hand, i.last_movement_at,
        CURRENT_DATE - i.last_movement_at::DATE as days_stale,
        p.name as product_name, pv.name as variant_name
       FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1 AND i.quantity_on_hand > 0
         AND i.last_movement_at < NOW() - INTERVAL '1 day' * $2
       ORDER BY i.last_movement_at ASC`,
      [dispensaryId, daysSinceMovement],
    );
  }

  async getInventoryHealthDashboard(dispensaryId: string): Promise<any> {
    const [stats] = await this._q(
      `SELECT
        COUNT(*) as total_skus,
        SUM(quantity_on_hand) as total_units,
        COUNT(*) FILTER (WHERE quantity_available <= COALESCE(reorder_threshold, 0) AND reorder_threshold IS NOT NULL) as low_stock,
        COUNT(*) FILTER (WHERE quantity_on_hand <= 0) as out_of_stock,
        COUNT(*) FILTER (WHERE expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE) as expired,
        COUNT(*) FILTER (WHERE expiration_date IS NOT NULL AND expiration_date > CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_30d,
        COUNT(*) FILTER (WHERE last_movement_at < NOW() - INTERVAL '30 days' AND quantity_on_hand > 0) as dead_stock
       FROM inventory WHERE dispensary_id = $1`, [dispensaryId],
    );

    const [pendingTransfers] = await this._q(
      `SELECT COUNT(*) as c FROM inventory_transfers WHERE (from_dispensary_id = $1 OR to_dispensary_id = $1) AND status IN ('requested','approved','in_transit')`, [dispensaryId],
    );

    const [pendingAdjustments] = await this._q(
      `SELECT COUNT(*) as c FROM inventory_adjustments WHERE dispensary_id = $1 AND status = 'pending'`, [dispensaryId],
    );

    return {
      totalSkus: parseInt(stats.total_skus), totalUnits: parseInt(stats.total_units),
      lowStock: parseInt(stats.low_stock), outOfStock: parseInt(stats.out_of_stock),
      expired: parseInt(stats.expired), expiring30d: parseInt(stats.expiring_30d),
      deadStock: parseInt(stats.dead_stock),
      pendingTransfers: parseInt(pendingTransfers.c),
      pendingAdjustments: parseInt(pendingAdjustments.c),
    };
  }

  // ── CRON: Daily alerts ────────────────────────────────────────────────────

  @Cron('0 7 * * *')
  async dailyInventoryAlerts(): Promise<void> {
    this.logger.log('Running daily inventory alerts...');
    const dispensaries = await this._q(`SELECT entity_id, name FROM dispensaries WHERE is_active = true`);
    for (const d of dispensaries) {
      const expiring = await this.getExpiringInventory(d.entity_id, 14);
      const reorder = await this.getReorderAlerts(d.entity_id);
      if (expiring.length > 0) this.logger.warn(`${d.name}: ${expiring.length} items expiring within 14 days`);
      if (reorder.length > 0) this.logger.warn(`${d.name}: ${reorder.length} items below reorder threshold`);
    }
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
