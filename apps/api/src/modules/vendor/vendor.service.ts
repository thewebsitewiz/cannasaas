import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ── DB row types ──────────────────────────────────────────────────────────

interface VendorRow {
  vendor_id: string;
  organization_id: string;
  name: string;
  vendor_type: string;
  license_number: string | null;
  license_state: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  payment_terms: string | null;
  notes: string | null;
  rating: string | number | null;
  is_active: boolean;
  total_pos?: string | number;
  completed_pos?: string | number;
  total_spend?: string | number;
  contacts?: VendorContactSummary[] | null;
  [key: string]: unknown;
}

interface VendorContactSummary {
  contactId: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
}

interface VendorContactRow {
  contact_id: string;
  vendor_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
}

interface PurchaseOrderRow {
  po_id: string;
  po_number: string;
  dispensary_id: string;
  vendor_id: string;
  status: string;
  payment_status: string | null;
  subtotal: string | number;
  total: string | number;
  payment_terms: string | null;
  notes: string | null;
  vendor_name?: string;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  line_items?: string | number;
  total_units?: string | number;
  created_at: Date | string;
  [key: string]: unknown;
}

interface PurchaseOrderItemRow {
  po_item_id: string;
  po_id: string;
  variant_id: string | null;
  product_name: string;
  sku: string | null;
  quantity_ordered: number;
  quantity_received: number | null;
  unit_cost: string | number;
  line_total: string | number;
}

interface VendorPaymentTermsRow {
  vendor_id: string;
  payment_terms: string | null;
}

interface PoStatusRow {
  status: string;
}

interface PoDispensaryRow {
  dispensary_id: string;
}

interface VendorStatsRow {
  active_vendors: string | number;
  total_pos: string | number;
  open_pos: string | number;
  total_spend: string | number;
  outstanding: string | number;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface VendorWithRelations extends Omit<VendorRow, 'contacts'> {
  contacts: VendorContactRow[];
  recentPOs: PurchaseOrderRow[];
}

export interface PurchaseOrderWithItems extends PurchaseOrderRow {
  items: PurchaseOrderItemRow[];
}

export interface CreateVendorInput {
  name: string;
  vendorType?: string;
  licenseNumber?: string;
  licenseState?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  paymentTerms?: string;
  notes?: string;
  contactName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateVendorInput {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  paymentTerms?: string;
  notes?: string;
}

export interface PoLineItemInput {
  variantId?: string;
  productName: string;
  sku?: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface VendorStatsDto {
  activeVendors: number;
  totalPOs: number;
  openPOs: number;
  totalSpend: number;
  outstanding: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class VendorService {
  private readonly logger = new Logger(VendorService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══ VENDORS ═══

  async getVendors(organizationId: string): Promise<VendorRow[]> {
    return rawQuery<VendorRow>(
      this.ds,
      `SELECT v.*,
        (SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id) as total_pos,
        (SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id AND po.status = 'received') as completed_pos,
        (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po WHERE po.vendor_id = v.vendor_id AND po.payment_status = 'paid') as total_spend,
        (SELECT json_agg(json_build_object('contactId', vc.contact_id, 'name', vc.name, 'title', vc.title, 'email', vc.email, 'phone', vc.phone, 'isPrimary', vc.is_primary)) FROM vendor_contacts vc WHERE vc.vendor_id = v.vendor_id) as contacts
       FROM vendors v WHERE v.organization_id = $1 ORDER BY v.name`,
      [organizationId],
    );
  }

  async getVendor(vendorId: string): Promise<VendorWithRelations> {
    const vendorRows = await rawQuery<VendorRow>(
      this.ds,
      'SELECT * FROM vendors WHERE vendor_id = $1',
      [vendorId],
    );
    const vendor = vendorRows[0];
    if (!vendor) throw new NotFoundException('Vendor not found');
    const contacts = await rawQuery<VendorContactRow>(
      this.ds,
      'SELECT * FROM vendor_contacts WHERE vendor_id = $1 ORDER BY is_primary DESC',
      [vendorId],
    );
    const recentPOs = await rawQuery<PurchaseOrderRow>(
      this.ds,
      'SELECT * FROM purchase_orders WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 10',
      [vendorId],
    );
    return { ...vendor, contacts, recentPOs };
  }

  async createVendor(
    orgId: string,
    input: CreateVendorInput,
  ): Promise<VendorRow> {
    const rows = await rawQuery<VendorRow>(
      this.ds,
      `INSERT INTO vendors (organization_id, name, vendor_type, license_number, license_state, address_line1, city, state, zip, phone, email, website, payment_terms, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        orgId,
        input.name,
        input.vendorType ?? 'cultivator',
        input.licenseNumber,
        input.licenseState,
        input.addressLine1,
        input.city,
        input.state,
        input.zip,
        input.phone,
        input.email,
        input.website,
        input.paymentTerms ?? 'net_30',
        input.notes,
      ],
    );
    const vendor = rows[0];

    if (input.contactName) {
      await this.ds.query(
        'INSERT INTO vendor_contacts (vendor_id, name, title, email, phone, is_primary) VALUES ($1,$2,$3,$4,$5,true)',
        [
          vendor.vendor_id,
          input.contactName,
          input.contactTitle,
          input.contactEmail ?? input.email,
          input.contactPhone ?? input.phone,
        ],
      );
    }

    this.logger.log('Vendor created: ' + input.name);
    return vendor;
  }

  async updateVendor(
    vendorId: string,
    input: UpdateVendorInput,
  ): Promise<VendorWithRelations> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined && val !== null) {
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(col + ' = $' + String(i++));
        params.push(val);
      }
    }
    if (sets.length === 0) throw new BadRequestException('Nothing to update');
    sets.push('updated_at = NOW()');
    params.push(vendorId);
    await this.ds.query(
      'UPDATE vendors SET ' +
        sets.join(', ') +
        ' WHERE vendor_id = $' +
        String(i),
      params,
    );
    return this.getVendor(vendorId);
  }

  // ═══ PURCHASE ORDERS ═══

  async getPurchaseOrders(
    dispensaryId: string,
    status?: string,
  ): Promise<PurchaseOrderRow[]> {
    let sql = `SELECT po.*, v.name as vendor_name,
      (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.po_id) as line_items,
      (SELECT COALESCE(SUM(poi.quantity_ordered), 0) FROM purchase_order_items poi WHERE poi.po_id = po.po_id) as total_units
     FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE po.dispensary_id = $1`;
    const params: unknown[] = [dispensaryId];
    if (status) {
      params.push(status);
      sql += ' AND po.status = $' + String(params.length);
    }
    sql += ' ORDER BY po.created_at DESC';
    return rawQuery<PurchaseOrderRow>(this.ds, sql, params);
  }

  async getPurchaseOrder(poId: string): Promise<PurchaseOrderWithItems> {
    const poRows = await rawQuery<PurchaseOrderRow>(
      this.ds,
      `SELECT po.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone
       FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE po.po_id = $1`,
      [poId],
    );
    const po = poRows[0];
    if (!po) throw new NotFoundException('Purchase order not found');
    const items = await rawQuery<PurchaseOrderItemRow>(
      this.ds,
      'SELECT * FROM purchase_order_items WHERE po_id = $1',
      [poId],
    );
    return { ...po, items };
  }

  async createPurchaseOrder(
    dispensaryId: string,
    vendorId: string,
    items: PoLineItemInput[],
    userId: string,
    notes?: string,
  ): Promise<PurchaseOrderWithItems> {
    const vendorRows = await rawQuery<VendorPaymentTermsRow>(
      this.ds,
      'SELECT vendor_id, payment_terms FROM vendors WHERE vendor_id = $1',
      [vendorId],
    );
    const vendor = vendorRows[0];
    if (!vendor) throw new NotFoundException('Vendor not found');

    const subtotal = items.reduce(
      (s, i) => s + i.quantityOrdered * i.unitCost,
      0,
    );
    const poNumber = 'PO-' + Date.now().toString(36).toUpperCase();

    const poRows = await rawQuery<PurchaseOrderRow>(
      this.ds,
      `INSERT INTO purchase_orders (po_number, dispensary_id, vendor_id, status, subtotal, total, payment_terms, notes, created_by_user_id)
       VALUES ($1,$2,$3,'draft',$4,$4,$5,$6,$7) RETURNING *`,
      [
        poNumber,
        dispensaryId,
        vendorId,
        subtotal.toFixed(2),
        vendor.payment_terms,
        notes,
        userId,
      ],
    );
    const po = poRows[0];

    for (const item of items) {
      const lineTotal = (item.quantityOrdered * item.unitCost).toFixed(2);
      await this.ds.query(
        'INSERT INTO purchase_order_items (po_id, variant_id, product_name, sku, quantity_ordered, unit_cost, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          po.po_id,
          item.variantId ?? null,
          item.productName,
          item.sku ?? null,
          item.quantityOrdered,
          item.unitCost,
          lineTotal,
        ],
      );
    }

    this.logger.log('PO created: ' + poNumber + ' for vendor ' + vendorId);
    return this.getPurchaseOrder(po.po_id);
  }

  async updatePOStatus(
    poId: string,
    status: string,
    userId: string,
  ): Promise<PurchaseOrderWithItems> {
    const validTransitions: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['shipped', 'cancelled'],
      shipped: ['received'],
      received: ['closed'],
    };

    const poRows = await rawQuery<PoStatusRow>(
      this.ds,
      'SELECT status FROM purchase_orders WHERE po_id = $1',
      [poId],
    );
    const po = poRows[0];
    if (!po) throw new NotFoundException('PO not found');

    const allowed = validTransitions[po.status] ?? [];
    if (!allowed.includes(status))
      throw new BadRequestException(
        'Cannot transition from ' + po.status + ' to ' + status,
      );

    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: unknown[] = [status];
    let i = 2;

    if (status === 'approved') {
      updates.push('approved_by_user_id = $' + String(i++));
      params.push(userId);
      updates.push('approved_at = NOW()');
    }
    if (status === 'received') {
      updates.push('received_by_user_id = $' + String(i++));
      params.push(userId);
      updates.push('received_at = NOW()');
      updates.push('actual_delivery = CURRENT_DATE');
      await this.ds.query(
        'UPDATE purchase_order_items SET quantity_received = quantity_ordered WHERE po_id = $1',
        [poId],
      );
    }

    params.push(poId);
    await this.ds.query(
      'UPDATE purchase_orders SET ' +
        updates.join(', ') +
        ' WHERE po_id = $' +
        String(i),
      params,
    );

    if (status === 'received') {
      const items = await rawQuery<PurchaseOrderItemRow>(
        this.ds,
        'SELECT * FROM purchase_order_items WHERE po_id = $1 AND variant_id IS NOT NULL',
        [poId],
      );
      const dispRows = await rawQuery<PoDispensaryRow>(
        this.ds,
        'SELECT dispensary_id FROM purchase_orders WHERE po_id = $1',
        [poId],
      );
      const poData = dispRows[0];
      for (const item of items) {
        await this.ds.query(
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

  async getVendorStats(organizationId: string): Promise<VendorStatsDto> {
    const rows = await rawQuery<VendorStatsRow>(
      this.ds,
      `SELECT
      (SELECT COUNT(*) FROM vendors WHERE organization_id = $1 AND is_active = true) as active_vendors,
      (SELECT COUNT(*) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1) as total_pos,
      (SELECT COUNT(*) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.status IN ('draft','submitted','approved','shipped')) as open_pos,
      (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.payment_status = 'paid') as total_spend,
      (SELECT COALESCE(SUM(po.total), 0)::DECIMAL(12,2) FROM purchase_orders po JOIN vendors v ON v.vendor_id = po.vendor_id WHERE v.organization_id = $1 AND po.payment_status = 'unpaid' AND po.status != 'cancelled') as outstanding
    `,
      [organizationId],
    );
    const stats = rows[0];

    return {
      activeVendors: toInt(stats.active_vendors),
      totalPOs: toInt(stats.total_pos),
      openPOs: toInt(stats.open_pos),
      totalSpend: toNumber(stats.total_spend),
      outstanding: toNumber(stats.outstanding),
    };
  }
}
