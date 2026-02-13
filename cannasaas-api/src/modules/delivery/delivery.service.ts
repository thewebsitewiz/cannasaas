// cannasaas-api/src/modules/delivery/delivery.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { NotificationGateway } from '../notifications/notification.gateway';

const STATUS_FLOW: DeliveryStatus[] = [
  DeliveryStatus.PENDING, DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.ARRIVING, DeliveryStatus.DELIVERED,
];

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(Delivery) private deliveryRepo: Repository<Delivery>,
    private notifications: NotificationGateway,
  ) {}

  async assignDriver(deliveryId: string, driverId: string, driverName: string) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });
    delivery.driverId = driverId;
    delivery.driverName = driverName;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.assignedAt = new Date();
    await this.deliveryRepo.save(delivery);

    this.notifications.sendToOrder(delivery.orderId, 'delivery:assigned', {
      driverName, estimatedMinutes: delivery.estimatedMinutes,
    });
    return delivery;
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });

    const currentIdx = STATUS_FLOW.indexOf(delivery.status);
    const newIdx = STATUS_FLOW.indexOf(status);
    if (newIdx <= currentIdx)
      throw new Error(`Cannot transition from ${delivery.status} to ${status}`);

    delivery.status = status;
    if (status === DeliveryStatus.PICKED_UP) delivery.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) delivery.deliveredAt = new Date();

    await this.deliveryRepo.save(delivery);
    this.notifications.sendToOrder(delivery.orderId, 'delivery:status', {
      status, timestamp: new Date(),
    });
    return delivery;
  }

  async updateLocation(deliveryId: string, lat: number, lng: number) {
    const delivery = await this.deliveryRepo.findOneOrFail({
      where: { id: deliveryId },
    });
    delivery.currentLat = lat;
    delivery.currentLng = lng;

    const distance = this.haversineDistance(lat, lng, delivery.lat, delivery.lng);
    delivery.estimatedMinutes = Math.max(2, Math.round(distance / 0.5));

    await this.deliveryRepo.save(delivery);
    this.notifications.sendToOrder(delivery.orderId, 'delivery:location', {
      lat, lng, estimatedMinutes: delivery.estimatedMinutes,
    });
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
