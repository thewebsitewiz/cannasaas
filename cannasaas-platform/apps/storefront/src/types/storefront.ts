/**
 * @file types/storefront.ts
 * @app apps/storefront
 *
 * Local product type used by ProductCard, ProductCarousel, ProductGrid.
 * Mirrors the GET /products API response shape.
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  strainType?: string;
  thcContent?: number;
  cbdContent?: number;
  description?: string;
  effects?: string[];
  flavors?: string[];
  terpenes?: Array<{ name: string; percentage?: number }>;
  images?: Array<{ url: string; isPrimary: boolean; alt?: string }>;
  variants: ProductVariant[];
  isActive: boolean;
  isNew?: boolean;
  onSale?: boolean;
  rating?: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  weight: number;
  weightUnit: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
}
