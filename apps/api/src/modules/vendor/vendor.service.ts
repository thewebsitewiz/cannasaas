import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ═══ VENDORS ═══

  async getVendors(organizationId: string): Promise<any[]> {
    return this._q(
      `SELECT v.*,
        (SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id) as total_pos,
        (SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id AND po.status = 'received') as completed_pos,
        (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id AND po.payment_status = 'paid') as total_spend,
        (SELECT json_agg(json_build_object('contactId', vc.contact_id, 'name', vc.name, 'title', vc.title, 'email', vc.email, 'phone', vc.phone, 'isPrimary', vc.is_primary)) FROM vendor_contacts vc WHERE vc.vendor_id = v.vendor_id) as contacts
       FROM vendors v WHERE v.organization_id = $1 ORDER BY v.name`,
      [organizationId],
    );
  }

  async getVendor(vendorId: string): Promise<any> {
    const [vendor] = await this._q('SELECT * FROM vendors WHERE vendor_id = $1', [vendorId]);
    if (!vendor) throw new NotFoundException('Vendor not found');
    const contacts = await this._q('SELECT * FROM vendor_contacts WHERE vendor_id = $1 ORDER BY is_primary DESC', [vendorId]);
    const recentPOs = await this._q('SELECT * FROM purchase_orders WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 10', [vendorId]);
    return { ...vendor, contacts, recentPOs };
  }

  async createVendor(orgId: string, input: any): Promise<any> {
    const [vendor] = await this._q(
      `INSERT INTO vendors (organization_id, name, vendor_type, license_number, license_state, address_line1, city, state, zip, phone, email, website, payment_terms, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [orgId, input.name, input.vendorType || 'cultivator', input.licenseNumber, input.licenseState, input.addressLine1, input.city, input.state, input.zip, input.phone, input.email, input.website, input.paymentTerms || 'net_30', input.notes],
    );

    if (input.contactName) {
      await this._q(
        'INSERT INTO vendor_contacts (vendor_id, name, title, email, phone, is_primary) VALUES ($1,$2,$3,$4,$5,true)',
        [vendor.vendor_id, input.contactName, input.contactTitle, input.contactEmail || input.email, input.contactPhone || input.phone],
      );
    }

    this.logger.log('Vendor created: ' + input.name);
    return vendor;
  }

  async updateVendor(vendorId: string, input: any): Promise<any> {
    const sets: string[] = []; const params: any[] = []; let i = 1;
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined && val !== null) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(col + ' = $' + i++); params.push(val);
      }
    }
    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    sets.push('updated_at = NOW()');
    params.push(vendorId);
    await this._q('UPDATE vendors SET ' + sets.join(', ') + ' WHERE vendor_id = $' + i, params);
    return this.getVendor(vendorId);
  }

  // ═══ PURCHASE ORDERS ═══

  async getPurchaseOrders(dispensaryId: string, status?: string): Promise<any[]> {
    let sql = `SELECT po.*, v.name as vendor_name,
      (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.po_id) as line_items,
      (SELECT COALESCE(SUM(poi.quantity_ordered), 0) FROM purchase_order_items poi WHERE poi.po_id = po.po_id) as total_units
     FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE po.dispensary_id = $1`;
    const params: any[] = [dispensaryId];
    if (status) { params.push(status); sql += ' AND po.status = $' + params.length; }
    sql += ' ORDER BY po.created_at DESC';
    return this._q(sql, params);
  }

  async getPurchaseOrder(poId: string): Promise<any> {
    const [po] = await this._q(
      `SELECT po.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone
       FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE po.po_id = $1`, [poId],
    );
    if (!po) throw new NotFoundException('Purchase order not found');
    const items = await this._q('SELECT * FROM purchase_order_items WHERE po_id = $1', [poId]);
    return { ...po, items };
  }

  async createPurchaseOrder(dispensaryId: string, vendorId: string, items: any[], userId: string, notes?: string): Promise<any> {
    const [vendor] = await this._q('SELECT vendor_id, payment_terms FROM vendors WHERE vendor_id = $1', [vendorId]);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const subtotal = items.reduce((s: number, i: any) => s + (i.quantityOrdered * i.unitCost), 0);
    const poNumber = 'PO-' + Date.now().toString(36).toUpperCase();

    const [po] = await this._q(
      `INSERT INTO purchase_orders (po_number, dispensary_id, vendor_id, status, subtotal, total, payment_terms, notes, created_by_user_id)
       VALUES ($1,$2,$3,'draft',$4,$4,$5,$6,$7) RETURNING *`,
      [poNumber, dispensaryId, vendorId, subtotal.toFixed(2), vendor.payment_terms, notes, userId],
    );

    for (const item of items) {
      const lineTotal = (item.quantityOrdered * item.unitCost).toFixed(2);
      await this._q(
        'INSERT INTO purchase_order_items (po_id, variant_id, product_name, sku, quantity_ordered, unit_cost, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [po.po_id, item.variantId || null, item.productName, item.sku || null, item.quantityOrdered, item.unitCost, lineTotal],
      );
    }

    this.logger.log('PO created: ' + poNumber + ' for vendor ' + vendorId);
    return this.getPurchaseOrder(po.po_id);
  }

  async updatePOStatus(poId: string, status: string, userId: string): Promise<any> {
    const validTransitions: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['shipped', 'cancelled'],
      shipped: ['received'],
      received: ['closed'],
    };

    const [po] = await this._q('SELECT status FROM purchase_orders WHERE po_id = $1', [poId]);
    if (!po) throw new NotFoundException('PO not found');

    const allowed = validTransitions[po.status] || [];
    if (!allowed.includes(status)) throw new BadRequestException('Cannot transition from ' + po.status + ' to ' + status);
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];
    let i = 2;

    if (status === 'approved') { updates.push('approved_by_user_id = $' + i++); params.push(userId); updates.push('approved_at = NOW()'); }
    if (status === 'received') {
      updates.push('received_by_user_id = $' + i++); params.push(userId);
      updates.push('received_at = NOW()');
      updates.push('actual_delivery = CURRENT_DATE');
      // Auto-mark all items as received
      await this._q('UPDATE purchase_order_items SET quantity_received = quantity_ordered WHERE po_id = $1', [poId]);
    }

    params.push(poId);
    await this._q('UPDATE purchase_orders SET ' + updates.join(', ') + ' WHERE po_id = $' + i, params);

    // If received, add to inventory
    if (status === 'received') {
      const items = await this._q('SELECT * FROM purchase_order_items WHERE po_id = $1 AND variant_id IS NOT NULL', [poId]);
      const [poData] = await this._q('SELECT dispensary_id FROM purchase_orders WHERE po_id = $1', [poId]);
      for (const item of items) {
        await this._q(
          `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, quantity_available = quantity_available + $1, updated_at = NOW()
           WHERE variant_id = $2 AND dispensary_id = $3`,
          [item.quantity_received, item.variant_id, poData.dispensary_id],
        );
      }
      this.logger.log('Inventory updated from PO: ' + poId);
    }

    return this.getPurchaseOrder(poId);
  }

  // ═══ STATS ═══

  async getVendorStats(organizationId: string): Promise<any> {
    const [stats] = await this._q(`SELECT
      (SELECT COUNT(*) FROM vendors WHERE organization_id = $1 AND is_active = true) as active_vendors,
      (SELECT COUNT(*) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1) as total_pos,
      (SELECT COUNT(*) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.status IN ('draft','submitted','approved','shipped')) as open_pos,
      (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.payment_status = 'paid') as total_spend,
      (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.payment_status = 'unpaid' AND po.status != 'cancelled') as outstanding
    `, [organizationId]);

    return {
      activeVendors: parseInt(stats.active_vendors),
      totalPOs: parseInt(stats.total_pos),
      openPOs: parseInt(stats.open_pos),
      totalSpend: parseFloat(stats.total_spend),
      outstanding: parseFloat(stats.outstanding),
    };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
