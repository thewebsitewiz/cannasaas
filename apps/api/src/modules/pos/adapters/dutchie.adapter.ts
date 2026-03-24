import { Logger } from '@nestjs/common';
import { PosProvider, PosCredentials, PosProduct, PosVariant, PosOrderPayload } from '../interfaces/pos-provider.interface';
import axios, { AxiosInstance, AxiosError } from 'axios';

/** Max retries for transient failures (5xx, network errors). */
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30_000,
    });

    // Response interceptor: log slow requests
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).__startTime;
        if (duration > 5000) {
          this.logger.warn(`Dutchie request took ${duration}ms: ${response.config.url}`);
        }
        return response;
      },
      (error) => Promise.reject(error),
    );

    // Request interceptor: track timing
    this.client.interceptors.request.use((config) => {
      (config as any).__startTime = Date.now();
      return config;
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.gql(
        `query TestConnection($dispensaryId: ID!) {
          dispensary(id: $dispensaryId) { id name }
        }`,
        { dispensaryId: this.dispensaryId },
      );
      return !!response?.dispensary;
    } catch (err: any) {
      this.logger.error(`Dutchie connection test failed: ${err.message}`);
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
        const data = await this.gql(
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

        const products = data?.menu?.products ?? [];
        for (const p of products) {
          allProducts.push(this.mapProduct(p));
        }

        // If fewer results than limit, we've reached the end
        hasMore = products.length === limit;
        offset += limit;
      }

      this.logger.log(`Dutchie fetchProducts: retrieved ${allProducts.length} products`);
      return allProducts;
    } catch (err: any) {
      this.logger.error(`Dutchie fetchProducts failed: ${err.message}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const data = await this.gql(
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
    } catch (err: any) {
      this.logger.error(`Dutchie fetchProductById(${externalId}) failed: ${err.message}`);
      return null;
    }
  }

  async fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>> {
    try {
      const products = await this.fetchProducts();
      const inventory: Array<{ externalVariantId: string; quantity: number }> = [];
      for (const p of products) {
        for (const v of p.variants) {
          inventory.push({ externalVariantId: v.externalId, quantity: v.quantity });
        }
      }
      return inventory;
    } catch (err: any) {
      this.logger.error(`Dutchie fetchInventory failed: ${err.message}`);
      return [];
    }
  }

  async updateInventory(externalVariantId: string, quantity: number): Promise<boolean> {
    try {
      const data = await this.gql(
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
    } catch (err: any) {
      this.logger.error(`Dutchie updateInventory(${externalVariantId}) failed: ${err.message}`);
      return false;
    }
  }

  async pushOrder(order: PosOrderPayload): Promise<{ externalOrderId: string }> {
    try {
      const data = await this.gql(
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
        this.logger.warn('Dutchie createOrder returned no id — generating fallback');
        return { externalOrderId: `dutchie-${Date.now()}` };
      }
      return { externalOrderId };
    } catch (err: any) {
      this.logger.error(`Dutchie pushOrder failed: ${err.message}`);
      return { externalOrderId: `dutchie-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    try {
      await this.gql(
        `mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { success }
        }`,
        { input: { orderId: externalOrderId, status: status.toUpperCase() } },
      );
    } catch (err: any) {
      this.logger.error(`Dutchie updateOrderStatus(${externalOrderId}) failed: ${err.message}`);
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Execute a GraphQL query/mutation against the Dutchie endpoint with
   * automatic retry for transient failures.
   */
  private async gql(query: string, variables: Record<string, any> = {}, attempt = 0): Promise<any> {
    try {
      const response = await this.client.post('', { query, variables });

      // Dutchie may return 200 with GraphQL-level errors
      if (response.data?.errors?.length) {
        const msgs = response.data.errors.map((e: any) => e.message).join('; ');
        throw new Error(`GraphQL errors: ${msgs}`);
      }

      return response.data?.data ?? null;
    } catch (err: any) {
      if (attempt < MAX_RETRIES && this.isRetryable(err)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.warn(`Dutchie request failed (attempt ${attempt + 1}), retrying in ${delay}ms: ${err.message}`);
        await this.sleep(delay);
        return this.gql(query, variables, attempt + 1);
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
      externalId: p.id,
      name: p.name ?? 'Unknown Product',
      category: p.category ?? '',
      brand: p.brand?.name,
      strainType: p.strainType?.toLowerCase(),
      thcContent: this.parsePercent(p.potencyThc?.formatted),
      cbdContent: this.parsePercent(p.potencyCbd?.formatted),
      description: p.description,
      imageUrl: p.image,
      variants: (p.variants ?? []).map((v: any): PosVariant => ({
        externalId: v.id,
        name: v.option ?? 'Default',
        price: parseFloat(v.price ?? 0),
        quantity: parseInt(v.quantity ?? 0, 10),
      })),
    };
  }

  private parsePercent(val?: string): number | undefined {
    if (!val) return undefined;
    const num = parseFloat(val.replace('%', ''));
    return isNaN(num) ? undefined : num;
  }
}
