/** Cannabis-specific strain classifications */
export type StrainType =
  | 'indica'
  | 'sativa'
  | 'hybrid'
  | 'indica_dominant_hybrid'
  | 'sativa_dominant_hybrid'
  | 'cbd_dominant';

/** Terpene profile entry */
export interface Terpene {
  name: string;       // e.g., "Myrcene"
  percentage: number; // 0-100
}

/** Cannabis-specific product metadata */
export interface CannabisInfo {
  strainType: StrainType;
  thcContent: number;  // percentage, e.g., 24.5
  cbdContent: number;
  terpenes: Terpene[];
  effects: string[];   // e.g., ["relaxing", "euphoric"]
  flavors: string[];
  growMethod?: 'indoor' | 'outdoor' | 'greenhouse';
  originState?: string;
}

/** A product variant (size/weight option with its own SKU and price) */
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;            // e.g., "1/8 oz", "1g", "500mg"
  sku: string;
  weight?: number;
  weightUnit?: 'g' | 'oz' | 'mg' | 'ml';
  price: number;
  compareAtPrice?: number; // Original price for sale display
  quantity: number;        // Current stock level
  lowStockThreshold: number;
  isActive: boolean;
  metrcPackageId?: string; // Metrc seed-to-sale tracking ID
}

/** Product image with alt text for accessibility */
export interface ProductImage {
  id: string;
  url: string;
  altText: string; // Required — WCAG 1.1.1 non-text content
  isPrimary: boolean;
  sortOrder: number;
}

/** Full product model */
export interface Product {
  id: string;
  dispensaryId: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: ProductCategory;
  cannabisInfo: CannabisInfo;
  variants: ProductVariant[];
  images: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  purchaseLimit?: number; // Per-order limit
  ageRestricted: boolean; // Always true for cannabis
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'flower'
  | 'pre_roll'
  | 'vape'
  | 'concentrate'
  | 'edible'
  | 'tincture'
  | 'topical'
  | 'capsule'
  | 'accessory';
