import { Order, OrderStatus } from './order.entity';
export declare class OrderStatusHistory {
    id: string;
    orderId: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    changedBy: string;
    notes: string;
    order: Order;
    createdAt: Date;
}
