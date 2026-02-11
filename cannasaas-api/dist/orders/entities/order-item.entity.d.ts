import { Order } from './order.entity';
export declare class OrderItem {
    id: string;
    orderId: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    batchNumber: string;
    licenseNumber: string;
    order: Order;
}
