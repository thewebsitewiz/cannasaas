import { Logger } from '@nestjs/common';
import {
  PosProvider,
  PosCredentials,
  PosProduct,
  PosVariant,
  PosOrderPayload,
} from '../interfaces/pos-provider.interface';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/** Max retries for transient failures (5xx, network errors). */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface DutchieGraphQLError {
  message: string;
}

interface DutchieGraphQLResponse<T> {
  data?: T;
  errors?: DutchieGraphQLError[];
}

interface RawDutchieVariant {
  id?: string;
  option?: string;
  price?: string | number;
  quantity?: string | number;
}

interface RawDutchiePotency {
  formatted?: string;
}

interface RawDutchieProduct {
  id?: string;
  name?: string;
  brand?: { name?: string } | null;
  category?: string;
  strainType?: string;
  description?: string;
  image?: string;
  potencyThc?: RawDutchiePotency | null;
  potencyCbd?: RawDutchiePotency | null;
  variants?: RawDutchieVariant[];
}

interface FetchMenuData {
  menu?: { products?: RawDutchieProduct[] };
}

interface FetchProductData {
  product?: RawDutchieProduct;
}

interface UpdateInventoryData {
  updateInventory?: { success?: boolean; message?: string };
}

interface CreateOrderData {
  createOrder?: { id?: string; status?: string };
}

interface DispensaryData {
  dispensary?: { id?: string; name?: string };
}

type TimedRequestConfig = AxiosRequestConfig & { __startTime?: number };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export class DutchieAdapter implements PosProvider {
  readonly providerName = 'dutchie';
  private readonly logger = new Logger(DutchieAdapter.name);
  private client!: AxiosInstance;
  private dispensaryId?: string;

  initialize(credentials: PosCredentials): void {
    this.dispensaryId = credentials.dispensaryExternalId;
    this.client = axios.create({
      baseURL: credentials.endpoint || 'https://dutchie.com/graphql',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30_000,
    });

    // Response interceptor: log slow requests
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as TimedRequestConfig;
        const startTime = config.__startTime ?? Date.now();
        const duration = Date.now() - startTime;
        if (duration > 5000) {
          this.logger.warn(
            `Dutchie request took ${duration}ms: ${response.config.url}`,
          );
        }
        return response;
      },
      (error: unknown) =>
        Promise.reject(
          error instanceof Error ? error : new Error(errorMessage(error)),
        ),
    );

    // Request interceptor: track timing
    this.client.interceptors.request.use((config) => {
      (config as TimedRequestConfig).__startTime = Date.now();
      return config;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const data = await this.gql<DispensaryData>(
        `query TestConnection($dispensaryId: ID!) {
          dispensary(id: $dispensaryId) { id name }
        }`,
        { dispensaryId: this.dispensaryId },
      );
      return !!data?.dispensary;
    } catch (err: unknown) {
      this.logger.error(`Dutchie connection test failed: ${errorMessage(err)}`);
      return false;
    }
  }

  async fetchProducts(): Promise<PosProduct[]> {
    try {
      const allProducts: PosProduct[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const data = await this.gql<FetchMenuData>(
          `query FetchMenu($dispensaryId: ID!, $limit: Int, $offset: Int) {
            menu(dispensaryId: $dispensaryId, limit: $limit, offset: $offset) {
              products {
                id name brand { name } category
                strainType description image
                potencyThc { formatted }
                potencyCbd { formatted }
                variants {
                  id option price quantity
                }
              }
            }
          }`,
          { dispensaryId: this.dispensaryId, limit, offset },
        );

        const products: RawDutchieProduct[] = data?.menu?.products ?? [];
        for (const p of products) {
          allProducts.push(this.mapProduct(p));
        }

        // If fewer results than limit, we've reached the end
        hasMore = products.length === limit;
        offset += limit;
      }

      this.logger.log(
        `Dutchie fetchProducts: retrieved ${allProducts.length} products`,
      );
      return allProducts;
    } catch (err: unknown) {
      this.logger.error(`Dutchie fetchProducts failed: ${errorMessage(err)}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const data = await this.gql<FetchProductData>(
        `query FetchProduct($productId: ID!) {
          product(id: $productId) {
            id name brand { name } category
            strainType description image
            potencyThc { formatted }
            potencyCbd { formatted }
            variants { id option price quantity }
          }
        }`,
        { productId: externalId },
      );
      const p = data?.product;
      return p ? this.mapProduct(p) : null;
    } catch (err: unknown) {
      this.logger.error(
        `Dutchie fetchProductById(${externalId}) failed: ${errorMessage(err)}`,
      );
      return null;
    }
  }

  async fetchInventory(): Promise<
    Array<{ externalVariantId: string; quantity: number }>
  > {
    try {
      const products = await this.fetchProducts();
      const inventory: Array<{ externalVariantId: string; quantity: number }> =
        [];
      for (const p of products) {
        for (const v of p.variants) {
          inventory.push({
            externalVariantId: v.externalId,
            quantity: v.quantity,
          });
        }
      }
      return inventory;
    } catch (err: unknown) {
      this.logger.error(`Dutchie fetchInventory failed: ${errorMessage(err)}`);
      return [];
    }
  }

  async updateInventory(
    externalVariantId: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const data = await this.gql<UpdateInventoryData>(
        `mutation UpdateInventory($input: UpdateInventoryInput!) {
          updateInventory(input: $input) { success message }
        }`,
        { input: { variantId: externalVariantId, quantity } },
      );
      const success = !!data?.updateInventory?.success;
      if (!success) {
        this.logger.warn(
          `Dutchie updateInventory returned failure for variant=${externalVariantId}: ${data?.updateInventory?.message ?? 'unknown'}`,
        );
      }
      return success;
    } catch (err: unknown) {
      this.logger.error(
        `Dutchie updateInventory(${externalVariantId}) failed: ${errorMessage(err)}`,
      );
      return false;
    }
  }

  async pushOrder(
    order: PosOrderPayload,
  ): Promise<{ externalOrderId: string }> {
    try {
      const data = await this.gql<CreateOrderData>(
        `mutation CreateOrder($input: CreateOrderInput!) {
          createOrder(input: $input) { id status }
        }`,
        {
          input: {
            dispensaryId: this.dispensaryId,
            orderType: order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
            items: order.items.map((i) => ({
              productId: i.externalProductId,
              variantId: i.externalVariantId,
              quantity: i.quantity,
              priceEach: i.price,
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
          },
        },
      );
      const externalOrderId = data?.createOrder?.id;
      if (!externalOrderId) {
        this.logger.warn(
          'Dutchie createOrder returned no id — generating fallback',
        );
        return { externalOrderId: `dutchie-${Date.now()}` };
      }
      return { externalOrderId };
    } catch (err: unknown) {
      this.logger.error(`Dutchie pushOrder failed: ${errorMessage(err)}`);
      return { externalOrderId: `dutchie-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(
    externalOrderId: string,
    status: string,
  ): Promise<void> {
    try {
      await this.gql(
        `mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { success }
        }`,
        { input: { orderId: externalOrderId, status: status.toUpperCase() } },
      );
    } catch (err: unknown) {
      this.logger.error(
        `Dutchie updateOrderStatus(${externalOrderId}) failed: ${errorMessage(err)}`,
      );
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Execute a GraphQL query/mutation against the Dutchie endpoint with
   * automatic retry for transient failures.
   */
  private async gql<T = unknown>(
    query: string,
    variables: Record<string, unknown> = {},
    attempt = 0,
  ): Promise<T | null> {
    try {
      const response = await this.client.post<DutchieGraphQLResponse<T>>('', {
        query,
        variables,
      });

      // Dutchie may return 200 with GraphQL-level errors
      if (response.data?.errors?.length) {
        const msgs = response.data.errors.map((e) => e.message).join('; ');
        throw new Error(`GraphQL errors: ${msgs}`);
      }

      return response.data?.data ?? null;
    } catch (err: unknown) {
      if (attempt < MAX_RETRIES && this.isRetryable(err)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(
          `Dutchie request failed (attempt ${attempt + 1}), retrying in ${delay}ms: ${errorMessage(err)}`,
        );
        await this.sleep(delay);
        return this.gql<T>(query, variables, attempt + 1);
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

  private mapProduct(p: RawDutchieProduct): PosProduct {
    return {
      externalId: p.id ?? '',
      name: p.name ?? 'Unknown Product',
      category: p.category ?? '',
      brand: p.brand?.name,
      strainType: p.strainType?.toLowerCase(),
      thcContent: this.parsePercent(p.potencyThc?.formatted),
      cbdContent: this.parsePercent(p.potencyCbd?.formatted),
      description: p.description,
      imageUrl: p.image,
      variants: (p.variants ?? []).map(
        (v): PosVariant => ({
          externalId: v.id ?? '',
          name: v.option ?? 'Default',
          price: parseFloat(String(v.price ?? 0)),
          quantity: parseInt(String(v.quantity ?? 0), 10),
        }),
      ),
    };
  }

  private parsePercent(val?: string): number | undefined {
    if (!val) return undefined;
    const num = parseFloat(val.replace('%', ''));
    return isNaN(num) ? undefined : num;
  }
}
