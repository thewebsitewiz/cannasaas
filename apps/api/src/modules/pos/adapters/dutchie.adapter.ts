import { Logger } from '@nestjs/common';
import { PosProvider, PosCredentials, PosProduct, PosVariant, PosOrderPayload } from '../interfaces/pos-provider.interface';
import axios, { AxiosInstance } from 'axios';

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
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.post('', {
        query: `query { dispensary(id: "${this.dispensaryId}") { id name } }`,
      });
      return !!response.data?.data?.dispensary;
    } catch (err: any) {
      this.logger.error(`Dutchie connection test failed: ${err.message}`);
      return false;
    }
  }

  async fetchProducts(): Promise<PosProduct[]> {
    try {
      const response = await this.client.post('', {
        query: `query {
          menu(dispensaryId: "${this.dispensaryId}") {
            products {
              id name brand { name } category
              strainType description image
              potencyThc { formatted }
              potencyCbd { formatted }
              variants {
                id option price
                quantity
              }
            }
          }
        }`,
      });

      const products = response.data?.data?.menu?.products ?? [];
      return products.map((p: any) => this.mapProduct(p));
    } catch (err: any) {
      this.logger.error(`Dutchie fetchProducts failed: ${err.message}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const response = await this.client.post('', {
        query: `query { product(id: "${externalId}") { id name brand { name } category strainType description image potencyThc { formatted } potencyCbd { formatted } variants { id option price quantity } } }`,
      });
      const p = response.data?.data?.product;
      return p ? this.mapProduct(p) : null;
    } catch {
      return null;
    }
  }

  async fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>> {
    const products = await this.fetchProducts();
    const inventory: Array<{ externalVariantId: string; quantity: number }> = [];
    for (const p of products) {
      for (const v of p.variants) {
        inventory.push({ externalVariantId: v.externalId, quantity: v.quantity });
      }
    }
    return inventory;
  }

  async updateInventory(externalVariantId: string, quantity: number): Promise<boolean> {
    try {
      const response = await this.client.post('', {
        query: `mutation { updateInventory(input: { variantId: "${externalVariantId}", quantity: ${quantity} }) { success } }`,
      });
      return !!response.data?.data?.updateInventory?.success;
    } catch (err: any) {
      this.logger.error(`Dutchie updateInventory failed: ${err.message}`);
      return false;
    }
  }

  async pushOrder(order: PosOrderPayload): Promise<{ externalOrderId: string }> {
    try {
      const response = await this.client.post('', {
        query: `mutation {
          createOrder(input: {
            dispensaryId: "${this.dispensaryId}"
            orderType: ${order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
            items: [${order.items.map(i => `{ productId: "${i.externalProductId}", variantId: "${i.externalVariantId}", quantity: ${i.quantity} }`).join(', ')}]
          }) { id }
        }`,
      });
      return { externalOrderId: response.data?.data?.createOrder?.id ?? `dutchie-${Date.now()}` };
    } catch (err: any) {
      this.logger.error(`Dutchie pushOrder failed: ${err.message}`);
      return { externalOrderId: `dutchie-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    try {
      await this.client.post('', {
        query: `mutation { updateOrderStatus(input: { orderId: "${externalOrderId}", status: "${status}" }) { success } }`,
      });
    } catch (err: any) {
      this.logger.error(`Dutchie updateOrderStatus failed: ${err.message}`);
    }
  }

  private mapProduct(p: any): PosProduct {
    return {
      externalId: p.id,
      name: p.name,
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
