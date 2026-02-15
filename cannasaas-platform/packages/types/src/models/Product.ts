export interface Product {
  _id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: { short: string; long: string; aiGenerated?: string };
  category: string;
  subcategory: string;
  tags: string[];
  brand: { name: string; logo?: string };
  cannabisInfo: CannabisInfo;
  variants: ProductVariant[];
  media: { images: ProductImage[]; videos?: ProductVideo[] };
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
  reviews: {
    count: number;
    averageRating: number;
    distribution: Record<number, number>;
  };
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CannabisInfo {
  strain: { name: string; type: string; genetics?: string };
  cannabinoids: {
    thc: { percentage: number; min?: number; max?: number };
    cbd: { percentage: number; min?: number; max?: number };
  };
  terpenes: Array<{ name: string; percentage: number }>;
  effects: { primary: string[]; medical?: string[] };
  flavors: string[];
  labTesting: {
    tested: boolean;
    labName?: string;
    batchNumber?: string;
    testDate?: string;
    coaUrl?: string;
  };
}

export interface ProductVariant {
  _id: string;
  name: string;
  sku: string;
  weight?: number;
  unit?: string;
  pricing: {
    basePrice: number;
    salePrice?: number;
    onSale: boolean;
    costPrice?: number;
    msrp?: number;
  };
  inventory: {
    quantity: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  };
  compliance?: {
    metrcId?: string;
    batchNumber?: string;
    harvestDate?: string;
    expirationDate?: string;
  };
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductVideo {
  url: string;
  thumbnail?: string;
}
