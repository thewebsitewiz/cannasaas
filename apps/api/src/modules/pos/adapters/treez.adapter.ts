import { Logger } from '@nestjs/common';
import { PosProvider, PosCredentials, PosProduct, PosVariant, PosOrderPayload } from '../interfaces/pos-provider.interface';
import axios, { AxiosInstance } from 'axios';

export class TreezAdapter implements PosProvider {
  readonly providerName = 'treez';
  private readonly logger = new Logger(TreezAdapter.name);
  private client!: AxiosInstance;

  initialize(credentials: PosCredentials): void {
    this.client = axios.create({
      baseURL: credentials.endpoint || 'https://api.treez.io/v2',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'X-Client-Id': credentials.clientId ?? '',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/store');
      return response.status === 200;
    } catch (err: any) {
      this.logger.error(`Treez connection test failed: ${err.message}`);
      return false;
    }
  }

  async fetchProducts(): Promise<PosProduct[]> {
    try {
      const response = await this.client.get('/inventory/products');
      const products = response.data?.products ?? response.data ?? [];
      return products.map((p: any) => this.mapProduct(p));
    } catch (err: any) {
      this.logger.error(`Treez fetchProducts failed: ${err.message}`);
      return [];
    }
  }

  async fetchProductById(externalId: string): Promise<PosProduct | null> {
    try {
      const response = await this.client.get(`/inventory/products/${externalId}`);
      return this.mapProduct(response.data);
    } catch {
      return null;
    }
  }

  async fetchInventory(): Promise<Array<{ externalVariantId: string; quantity: number }>> {
    try {
      const response = await this.client.get('/inventory/quantities');
      const items = response.data?.inventory ?? response.data ?? [];
      return items.map((i: any) => ({
        externalVariantId: i.variant_id ?? i.id,
        quantity: parseInt(i.sellable_quantity ?? i.quantity ?? 0, 10),
      }));
    } catch (err: any) {
      this.logger.error(`Treez fetchInventory failed: ${err.message}`);
      return [];
    }
  }

  async updateInventory(externalVariantId: string, quantity: number): Promise<boolean> {
    try {
      const response = await this.client.put(`/inventory/${externalVariantId}`, {
        sellable_quantity: quantity,
      });
      return response.status === 200;
    } catch (err: any) {
      this.logger.error(`Treez updateInventory failed: ${err.message}`);
      return false;
    }
  }

  async pushOrder(order: PosOrderPayload): Promise<{ externalOrderId: string }> {
    try {
      const response = await this.client.post('/tickets', {
        type: order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP',
        items: order.items.map(i => ({
          product_id: i.externalProductId,
          size_id: i.externalVariantId,
          quantity: i.quantity,
          price_each: i.price,
        })),
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
      });
      return { externalOrderId: response.data?.ticket_id ?? `treez-${Date.now()}` };
    } catch (err: any) {
      this.logger.error(`Treez pushOrder failed: ${err.message}`);
      return { externalOrderId: `treez-err-${Date.now()}` };
    }
  }

  async updateOrderStatus(externalOrderId: string, status: string): Promise<void> {
    try {
      await this.client.put(`/tickets/${externalOrderId}/status`, { status });
    } catch (err: any) {
      this.logger.error(`Treez updateOrderStatus failed: ${err.message}`);
    }
  }

  private mapProduct(p: any): PosProduct {
    return {
      externalId: p.id ?? p.product_id,
      name: p.name ?? p.product_name,
      category: p.category ?? p.product_category ?? '',
      brand: p.brand ?? p.brand_name,
      productType: p.product_type,
      strainType: p.strain_type?.toLowerCase(),
      thcContent: parseFloat(p.thc_content ?? p.thc ?? 0) || undefined,
      cbdContent: parseFloat(p.cbd_content ?? p.cbd ?? 0) || undefined,
      description: p.description,
      imageUrl: p.image_url ?? p.image,
      variants: (p.sizes ?? p.variants ?? [{ id: p.id, name: 'Default', price: p.price, quantity: p.quantity }]).map((v: any): PosVariant => ({
        externalId: v.id ?? v.size_id,
        name: v.name ?? v.option ?? 'Default',
        sku: v.sku,
        price: parseFloat(v.price ?? 0),
        quantity: parseInt(v.sellable_quantity ?? v.quantity ?? 0, 10),
        weight: v.weight ? parseFloat(v.weight) : undefined,
        weightUnit: v.weight_unit,
      })),
    };
  }
}
