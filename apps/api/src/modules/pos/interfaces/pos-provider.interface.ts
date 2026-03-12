// src/modules/pos/interfaces/pos-provider.interface.ts

export interface PosCredentials {
  apiKey: string;
  endpoint?: string;
  clientId?: string;
  dispensaryExternalId?: string;
}

export interface PosProduct {
  externalId: string;
  name: string;
  category: string;
  brand?: string;
  productType?: string;
  strainType?: string;
  thcContent?: number;
  cbdContent?: number;
  description?: string;
  imageUrl?: string;
  variants: PosVariant[];
}

export interface PosVariant {
  externalId: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
}

export interface PosOrderPayload {
  externalId?: string;
  items: Array<{
    externalProductId: string;
    externalVariantId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  orderType: 'pickup' | 'delivery';
}

export interface PosProvider {
  readonly providerName: string;

  // Connection
  initialize(credentials: PosCredentials): void;
  testConnection(): Promise<boolean>;

  // Product/Menu Sync
  fetchProducts(): Promise<PosProduct[]>;
  fetchProductById(externalId: string): Promise<PosProduct | null>;

  // Inventory
  fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>>;
  updateInventory(externalVariantId: string, quantity: number): Promise<boolean>;

  // Orders
  pushOrder(order: PosOrderPayload): Promise<{ externalOrderId: string }>;
  updateOrderStatus(externalOrderId: string, status: string): Promise<void>;
}
