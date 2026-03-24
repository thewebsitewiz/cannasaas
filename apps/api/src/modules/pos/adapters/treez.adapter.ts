import { Logger } from '@nestjs/common';
import { PosProvider, PosCredentials, PosProduct, PosVariant, PosOrderPayload } from '../interfaces/pos-provider.interface';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

/** Max retries for transient failures (5xx, network errors). */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export class TreezAdapter implements PosProvider {
  readonly providerName = 'treez';
  private readonly logger = new Logger(TreezAdapter.name);
  private client!: AxiosInstance;
  private dispensaryExternalId?: string;

  initialize(credentials: PosCredentials): void {
    this.dispensaryExternalId = credentials.dispensaryExternalId;
    this.client = axios.create({
      baseURL: credentials.endpoint || 'https://api.treez.io/v2',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'X-Client-Id': credentials.clientId ?? '',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30_000,
    });

    // Response interceptor: log slow requests and handle rate-limiting
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).__startTime;
        if (duration > 5000) {
          this.logger.warn(`Treez request took ${duration}ms: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Handle 429 rate-limiting: respect Retry-After header
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] as string, 10);
          const delayMs = (isNaN(retryAfter) ? 5 : retryAfter) * 1000;
          this.logger.warn(`Treez rate-limited, waiting ${delayMs}ms before retry`);
          await this.sleep(delayMs);
          return this.client.request(error.config as AxiosRequestConfig);
        }
        return Promise.reject(error);
      },
    );

    // Request interceptor: track timing
    this.client.interceptors.request.use((config) => {
      (config as any).__startTime = Date.now();
      return config;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('GET', '/store');
      return response.status === 200;
    } catch (err: any) {
      this.logger.error(`Treez connection test failed: ${err.message}`);
      return false;
    }
  }

  async fetchProducts(): Promise<PosProduct[]> {
    try {
      const allProducts: PosProduct[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request('GET', '/inventory/products', {
          params: { page, page_size: pageSize },
        });

        const products = response.data?.products ?? response.data?.data ?? response.data ?? [];
        for (const p of products) {
          allProducts.push(this.mapProduct(p));
        }

        // If fewer results than page size, we've reached the end
        hasMore = Array.isArray(products) && products.length === pageSize;
        page++;
      }

      this.logger.log(`Treez fetchProducts: retrieved ${allProducts.length} products`);
      return allProducts;
    } catch (err: any) {
      this.logger.error(`Treez fetchProducts failed: ${err.message}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const response = await this.request('GET', `/inventory/products/${externalId}`);
      const product = response.data?.product ?? response.data;
      if (!product || !product.id) return null;
      return this.mapProduct(product);
    } catch (err: any) {
      if ((err as AxiosError).response?.status === 404) return null;
      this.logger.error(`Treez fetchProductById(${externalId}) failed: ${err.message}`);
      return null;
    }
  }

  async fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>> {
    try {
      const allInventory: Array<{ externalVariantId: string; quantity: number }> = [];
      let page = 1;
      const pageSize = 200;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request('GET', '/inventory/quantities', {
          params: { page, page_size: pageSize },
        });

        const items = response.data?.inventory ?? response.data?.data ?? response.data ?? [];
        for (const i of items) {
          allInventory.push({
            externalVariantId: i.variant_id ?? i.size_id ?? i.id,
            quantity: parseInt(i.sellable_quantity ?? i.quantity ?? 0, 10),
          });
        }

        hasMore = Array.isArray(items) && items.length === pageSize;
        page++;
      }

      this.logger.log(`Treez fetchInventory: retrieved ${allInventory.length} entries`);
      return allInventory;
    } catch (err: any) {
      this.logger.error(`Treez fetchInventory failed: ${err.message}`);
      return [];
    }
  }

  async updateInventory(externalVariantId: string, quantity: number): Promise<boolean> {
    try {
      const response = await this.request('PUT', `/inventory/${externalVariantId}`, {
        data: { sellable_quantity: quantity },
      });
      if (response.status === 200) return true;
      this.logger.warn(
        `Treez updateInventory unexpected status ${response.status} for variant=${externalVariantId}`,
      );
      return false;
    } catch (err: any) {
      this.logger.error(`Treez updateInventory(${externalVariantId}) failed: ${err.message}`);
      return false;
    }
  }

  async pushOrder(order: PosOrderPayload): Promise<{ externalOrderId: string }> {
    try {
      const response = await this.request('POST', '/tickets', {
        data: {
          type: order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
          items: order.items.map((i) => ({
            product_id: i.externalProductId,
            size_id: i.externalVariantId,
            quantity: i.quantity,
            price_each: i.price,
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
        },
      });

      const externalOrderId = response.data?.ticket_id ?? response.data?.id;
      if (!externalOrderId) {
        this.logger.warn('Treez createOrder returned no ticket_id — generating fallback');
        return { externalOrderId: `treez-${Date.now()}` };
      }
      return { externalOrderId };
    } catch (err: any) {
      this.logger.error(`Treez pushOrder failed: ${err.message}`);
      return { externalOrderId: `treez-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    try {
      await this.request('PUT', `/tickets/${externalOrderId}/status`, {
        data: { status },
      });
    } catch (err: any) {
      this.logger.error(`Treez updateOrderStatus(${externalOrderId}) failed: ${err.message}`);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Unified HTTP helper with automatic retry for transient failures (5xx, network errors).
   */
  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    options: { params?: Record<string, any>; data?: any } = {},
    attempt = 0,
  ): Promise<any> {
    try {
      return await this.client.request({
        method,
        url,
        params: options.params,
        data: options.data,
      });
    } catch (err: any) {
      if (attempt < MAX_RETRIES && this.isRetryable(err)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Treez ${method} ${url} failed (attempt ${attempt + 1}), retrying in ${delay}ms: ${err.message}`,
        );
        await this.sleep(delay);
        return this.request(method, url, options, attempt + 1);
      }
      throw err;
    }
  }

  /** Returns true for network errors and 5xx status codes. */
  private isRetryable(err: any): boolean {
    if (!err.response) return true; // network / timeout error
    const status = (err as AxiosError).response?.status ?? 0;
    return status >= 500 && status < 600;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapProduct(p: any): PosProduct {
    return {
      externalId: p.id ?? p.product_id,
      name: p.name ?? p.product_name ?? 'Unknown Product',
      category: p.category ?? p.product_category ?? '',
      brand: p.brand ?? p.brand_name,
      productType: p.product_type,
      strainType: p.strain_type?.toLowerCase(),
      thcContent: this.parseNumeric(p.thc_content ?? p.thc),
      cbdContent: this.parseNumeric(p.cbd_content ?? p.cbd),
      description: p.description,
      imageUrl: p.image_url ?? p.image,
      variants: this.mapVariants(p),
    };
  }

  private mapVariants(p: any): PosVariant[] {
    const rawVariants = p.sizes ?? p.variants ?? [];

    // If no nested variants, treat the product itself as a single variant
    if (!rawVariants.length) {
      return [{
        externalId: p.id ?? p.product_id,
        name: 'Default',
        price: parseFloat(p.price ?? 0),
        quantity: parseInt(p.sellable_quantity ?? p.quantity ?? 0, 10),
      }];
    }

    return rawVariants.map((v: any): PosVariant => ({
      externalId: v.id ?? v.size_id,
      name: v.name ?? v.option ?? 'Default',
      sku: v.sku,
      price: parseFloat(v.price ?? 0),
      quantity: parseInt(v.sellable_quantity ?? v.quantity ?? 0, 10),
      weight: v.weight ? parseFloat(v.weight) : undefined,
      weightUnit: v.weight_unit,
    }));
  }

  private parseNumeric(val: any): number | undefined {
    if (val == null) return undefined;
    const num = parseFloat(String(val));
    return isNaN(num) ? undefined : num;
  }
}
