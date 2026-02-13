import { ConfigService } from '@nestjs/config';
export declare class MetrcService {
    private config;
    private readonly client;
    private readonly license;
    constructor(config: ConfigService);
    reportSale(sale: {
        salesDate: string;
        salesCustomerType: string;
        transactions: Array<{
            packageLabel: string;
            quantity: number;
            unitOfMeasure: string;
            totalAmount: number;
        }>;
    }): Promise<void>;
    getActivePackages(): Promise<any[]>;
    adjustPackage(label: string, quantity: number, reason: string, adjustDate: string): Promise<void>;
    healthCheck(): Promise<boolean>;
}
