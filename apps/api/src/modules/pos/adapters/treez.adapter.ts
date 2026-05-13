import { Logger } from '@nestjs/common';
import {
  PosProvider,
  PosCredentials,
  PosProduct,
  PosVariant,
  PosOrderPayload,
} from '../interfaces/pos-provider.interface';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

/** Max retries for transient failures (5xx, network errors). */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/** Loose shape of a Treez product as it comes off the wire. */
interface RawTreezVariant {
  id?: string;
  size_id?: string;
  name?: string;
  option?: string;
  sku?: string;
  price?: string | number;
  sellable_quantity?: string | number;
  quantity?: string | number;
  weight?: string | number;
  weight_unit?: string;
}

interface RawTreezProduct {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  category?: string;
  product_category?: string;
  brand?: string;
  brand_name?: string;
  product_type?: string;
  strain_type?: string;
  thc_content?: string | number;
  thc?: string | number;
  cbd_content?: string | number;
  cbd?: string | number;
  description?: string;
  image_url?: string;
  image?: string;
  price?: string | number;
  sellable_quantity?: string | number;
  quantity?: string | number;
  sizes?: RawTreezVariant[];
  variants?: RawTreezVariant[];
}

interface RawTreezInventoryEntry {
  variant_id?: string;
  size_id?: string;
  id?: string;
  sellable_quantity?: string | number;
  quantity?: string | number;
}

/** Augments AxiosRequestConfig with our timing-instrumentation hook. */
type TimedRequestConfig = AxiosRequestConfig & { __startTime?: number };
type TimedResponseConfig = TimedRequestConfig;

interface TreezRequestOptions {
  params?: Record<string, unknown>;
  data?: unknown;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

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
        Authorization: `Bearer ${credentials.apiKey}`,
        'X-Client-Id': credentials.clientId ?? '',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30_000,
    });

    // Response interceptor: log slow requests and handle rate-limiting
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as TimedResponseConfig;
        const startTime = config.__startTime ?? Date.now();
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          this.logger.warn(
            `Treez request took ${duration}ms: ${response.config.method?.toUpperCase()} ${response.config.url}`,
          );
        }
        return response;
      },
      async (error: AxiosError) => {
        // Handle 429 rate-limiting: respect Retry-After header
        if (error.response?.status === 429) {
          const retryAfter = parseInt(
            String(error.response.headers['retry-after'] ?? ''),
            10,
          );
          const delayMs = (isNaN(retryAfter) ? 5 : retryAfter) * 1000;
          this.logger.warn(
            `Treez rate-limited, waiting ${delayMs}ms before retry`,
          );
          await this.sleep(delayMs);
          return this.client.request(error.config as AxiosRequestConfig);
        }
        return Promise.reject(error);
      },
    );

    // Request interceptor: track timing
    this.client.interceptors.request.use((config) => {
      (config as TimedRequestConfig).__startTime = Date.now();
      return config;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('GET', '/store');
      return response.status === 200;
    } catch (err: unknown) {
      this.logger.error(`Treez connection test failed: ${errorMessage(err)}`);
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
        const response = await this.request<{
          products?: RawTreezProduct[];
          data?: RawTreezProduct[];
        }>('GET', '/inventory/products', {
          params: { page, page_size: pageSize },
        });

        const products: RawTreezProduct[] =
          response.data?.products ??
          response.data?.data ??
          (Array.isArray(response.data) ? response.data : []);
        for (const p of products) {
          allProducts.push(this.mapProduct(p));
        }

        // If fewer results than page size, we've reached the end
        hasMore = Array.isArray(products) && products.length === pageSize;
        page++;
      }

      this.logger.log(
        `Treez fetchProducts: retrieved ${allProducts.length} products`,
      );
      return allProducts;
    } catch (err: unknown) {
      this.logger.error(`Treez fetchProducts failed: ${errorMessage(err)}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const response = await this.request<
        { product?: RawTreezProduct } & RawTreezProduct
      >('GET', `/inventory/products/${externalId}`);
      const product = response.data?.product ?? response.data;
      if (!product || !product.id) return null;
      return this.mapProduct(product);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 404) return null;
      this.logger.error(
        `Treez fetchProductById(${externalId}) failed: ${errorMessage(err)}`,
      );
      return null;
    }
  }

  async fetchInventory(): Promise<
    Array<{ externalVariantId: string; quantity: number }>
  > {
    try {
      const allInventory: Array<{
        externalVariantId: string;
        quantity: number;
      }> = [];
      let page = 1;
      const pageSize = 200;
      let hasMore = true;

      while (hasMore) {
        const response = await this.request<{
          inventory?: RawTreezInventoryEntry[];
          data?: RawTreezInventoryEntry[];
        }>('GET', '/inventory/quantities', {
          params: { page, page_size: pageSize },
        });

        const items: RawTreezInventoryEntry[] =
          response.data?.inventory ??
          response.data?.data ??
          (Array.isArray(response.data) ? response.data : []);
        for (const i of items) {
          allInventory.push({
            externalVariantId: i.variant_id ?? i.size_id ?? i.id ?? '',
            quantity: parseInt(
              String(i.sellable_quantity ?? i.quantity ?? 0),
              10,
            ),
          });
        }

        hasMore = Array.isArray(items) && items.length === pageSize;
        page++;
      }

      this.logger.log(
        `Treez fetchInventory: retrieved ${allInventory.length} entries`,
      );
      return allInventory;
    } catch (err: unknown) {
      this.logger.error(`Treez fetchInventory failed: ${errorMessage(err)}`);
      return [];
    }
  }

  async updateInventory(
    externalVariantId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const response = await this.request(
        'PUT',
        `/inventory/${externalVariantId}`,
        {
          data: { sellable_quantity: quantity },
        },
      );
      if (response.status === 200) return true;
      this.logger.warn(
        `Treez updateInventory unexpected status ${response.status} for variant=${externalVariantId}`,
      );
      return false;
    } catch (err: unknown) {
      this.logger.error(
        `Treez updateInventory(${externalVariantId}) failed: ${errorMessage(err)}`,
      );
      return false;
    }
  }

  async pushOrder(
    order: PosOrderPayload,
  ): Promise<{ externalOrderId: string }> {
    try {
      const response = await this.request<{ ticket_id?: string; id?: string }>(
        'POST',
        '/tickets',
        {
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
        },
      );

      const externalOrderId = response.data?.ticket_id ?? response.data?.id;
      if (!externalOrderId) {
        this.logger.warn(
          'Treez createOrder returned no ticket_id — generating fallback',
        );
        return { externalOrderId: `treez-${Date.now()}` };
      }
      return { externalOrderId };
    } catch (err: unknown) {
      this.logger.error(`Treez pushOrder failed: ${errorMessage(err)}`);
      return { externalOrderId: `treez-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(
    externalOrderId: string,
    status: string,
  ): Promise<void> {
    try {
      await this.request('PUT', `/tickets/${externalOrderId}/status`, {
        data: { status },
      });
    } catch (err: unknown) {
      this.logger.error(
        `Treez updateOrderStatus(${externalOrderId}) failed: ${errorMessage(err)}`,
      );
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Unified HTTP helper with automatic retry for transient failures (5xx, network errors).
   */
  private async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    options: TreezRequestOptions = {},
    attempt = 0,
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>({
        method,
        url,
        params: options.params,
        data: options.data,
      });
    } catch (err: unknown) {
      if (attempt < MAX_RETRIES && this.isRetryable(err)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Treez ${method} ${url} failed (attempt ${attempt + 1}), retrying in ${delay}ms: ${errorMessage(err)}`,
        );
        await this.sleep(delay);
        return this.request<T>(method, url, options, attempt + 1);
      }
      throw err;
    }
  }

  /** Returns true for network errors and 5xx status codes. */
  private isRetryable(err: unknown): boolean {
    const axiosErr = err as AxiosError;
    if (!axiosErr.response) return true; // network / timeout error
    const status = axiosErr.response.status ?? 0;
    return status >= 500 && status < 600;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapProduct(p: RawTreezProduct): PosProduct {
    return {
      externalId: p.id ?? p.product_id ?? '',
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

  private mapVariants(p: RawTreezProduct): PosVariant[] {
    const rawVariants: RawTreezVariant[] = p.sizes ?? p.variants ?? [];

    // If no nested variants, treat the product itself as a single variant
    if (!rawVariants.length) {
      return [
        {
          externalId: p.id ?? p.product_id ?? '',
          name: 'Default',
          price: parseFloat(String(p.price ?? 0)),
          quantity: parseInt(
            String(p.sellable_quantity ?? p.quantity ?? 0),
            10,
          ),
        },
      ];
    }

    return rawVariants.map(
      (v): PosVariant => ({
        externalId: v.id ?? v.size_id ?? '',
        name: v.name ?? v.option ?? 'Default',
        sku: v.sku,
        price: parseFloat(String(v.price ?? 0)),
        quantity: parseInt(String(v.sellable_quantity ?? v.quantity ?? 0), 10),
        weight: v.weight != null ? parseFloat(String(v.weight)) : undefined,
        weightUnit: v.weight_unit,
      }),
    );
  }

  private parseNumeric(val: unknown): number | undefined {
    if (val == null) return undefined;
    if (typeof val === 'number') return isNaN(val) ? undefined : val;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }
}
