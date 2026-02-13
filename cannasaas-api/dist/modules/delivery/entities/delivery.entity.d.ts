export declare enum DeliveryStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    ARRIVING = "arriving",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Delivery {
    id: string;
    orderId: string;
    organizationId: string;
    driverId: string;
    driverName: string;
    status: DeliveryStatus;
    lat: number;
    lng: number;
    currentLat: number;
    currentLng: number;
    estimatedMinutes: number;
    deliveryAddress: string;
    customerPhone: string;
    assignedAt: Date;
    pickedUpAt: Date;
    deliveredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
