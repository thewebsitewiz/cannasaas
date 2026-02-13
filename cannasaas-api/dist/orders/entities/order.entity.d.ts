import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { User } from '../../users/entities/user.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY_FOR_PICKUP = "ready_for_pickup",
    OUT_FOR_DELIVERY = "out_for_delivery",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    AUTHORIZED = "authorized",
    CAPTURED = "captured",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum FulfillmentType {
    PICKUP = "pickup",
    DELIVERY = "delivery"
}
export declare class Order {
    id: string;
    orderNumber: string;
    userId: string;
    dispensaryId: string;
    tenantId: string;
    subtotal: number;
    taxAmount: number;
    exciseTax: number;
    discountAmount: number;
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentType: FulfillmentType;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deliveryAddress: string;
    notes: string;
    internalNotes: string;
    confirmedAt: Date;
    completedAt: Date;
    cancelledAt: Date;
    user: User;
    dispensary: Dispensary;
    items: OrderItem[];
    statusHistory: OrderStatusHistory[];
    createdAt: Date;
    updatedAt: Date;
    customerId: string;
    totalWeight: number;
}
