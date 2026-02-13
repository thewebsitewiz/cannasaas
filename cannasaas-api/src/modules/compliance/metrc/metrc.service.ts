// cannasaas-api/src/modules/compliance/metrc/metrc.service.ts
import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MetrcService {
  private readonly client: AxiosInstance;
  private readonly license: string;

  constructor(private config: ConfigService) {
    const vendorKey = this.config.get('METRC_VENDOR_KEY');
    const userKey = this.config.get('METRC_USER_KEY');
    this.license = this.config.get('METRC_LICENSE_NUMBER');

    this.client = axios.create({
      baseURL: this.config.get('METRC_BASE_URL'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${vendorKey}:${userKey}`).toString('base64')}`,
      },
      timeout: 30000,
    });
  }

  async reportSale(sale: {
    salesDate: string;
    salesCustomerType: string;
    transactions: Array<{
      packageLabel: string; quantity: number;
      unitOfMeasure: string; totalAmount: number;
    }>;
  }) {
    try {
      await this.client.post(
        `/sales/v2/receipts?licenseNumber=${this.license}`, [sale]);
    } catch (error) {
      throw new HttpException('METRC sync failed', 502);
    }
  }

  async getActivePackages(): Promise<any[]> {
    const response = await this.client.get(
      `/packages/v2/active?licenseNumber=${this.license}`);
    return response.data;
  }

  async adjustPackage(label: string, quantity: number,
    reason: string, adjustDate: string) {
    await this.client.post(
      `/packages/v2/adjust?licenseNumber=${this.license}`,
      [{ Label: label, Quantity: quantity, UnitOfMeasure: 'Grams',
        AdjustmentReason: reason, AdjustmentDate: adjustDate }]);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get(`/facilities/v2?licenseNumber=${this.license}`);
      return true;
    } catch { return false; }
  }
}
