import { TaxLineItem } from './dto/order-summary.type';

/** Row shape returned from lkp_tax_categories */
export interface TaxCategoryRow {
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
export type ProductTypeCode = string;

export interface DispensaryStateRow {
  entity_id: string;
  state: string;
  is_active: boolean;
}

export interface ProductLookupRow {
  id: string;
  name: string;
  is_active: boolean;
  is_approved: boolean;
  metrc_item_uid: string | null;
  dispensary_id: string;
  total_thc_mg_per_container: string | null;
  product_type_code: string | null;
}

export interface PricingRow {
  price: string;
}

export interface InventoryAvailabilityRow {
  quantity_available: string;
}

export interface OrderInsertRow {
  orderId: string;
  createdAt: Date;
}

export interface ResolvedLineItem {
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

export interface CompleteOrderRow {
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

export interface CompleteOrderLineItemRow {
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

export interface CancelOrderRow {
  orderId: string;
  orderStatus: string;
}

export interface CancelLineItemRow {
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
