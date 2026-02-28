import type { Product, ProductVariant } from './Product';

export interface CartItem {
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
  product: Product;
  variant: ProductVariant;
}

export interface Cart {
  id: string;
  dispensaryId: string;
  customerId?: string;
  items: CartItem[];
  promoCode?: string;
  promoDiscount: number;
  subtotal: number;
  tax: number;
  total: number;
}
