import { Order } from './order.entity';
export declare class OrderStatusHistory {
    id: string;
    orderId: string;
    fromStatus: string;
    toStatus: string;
    changedBy: string;
    notes: string;
    order: Order;
    createdAt: Date;
}
