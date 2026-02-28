export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type FulfillmentType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight: number;
  weightUnit: string;
  batchNumber?: string;
  thcContent?: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable: CS-2026-001234
  dispensaryId: string;
  customerId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  deliveryFee: number;
  total: number;
  promoCode?: string;
  deliveryAddress?: Address;
  pickupReadyAt?: string;
  estimatedDeliveryAt?: string;
  driverId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
}
