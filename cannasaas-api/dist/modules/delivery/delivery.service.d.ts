import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { NotificationGateway } from '../notifications/notification.gateway';
export declare class DeliveryService {
    private deliveryRepo;
    private notifications;
    private readonly logger;
    constructor(deliveryRepo: Repository<Delivery>, notifications: NotificationGateway);
    assignDriver(deliveryId: string, driverId: string, driverName: string): Promise<Delivery>;
    updateStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery>;
    updateLocation(deliveryId: string, lat: number, lng: number): Promise<void>;
    private haversineDistance;
}
