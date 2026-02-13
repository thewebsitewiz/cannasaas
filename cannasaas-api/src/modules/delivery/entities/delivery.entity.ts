// cannasaas-api/src/modules/delivery/entities/delivery.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVING = 'arriving',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
@Index(['orderId'])
@Index(['driverId', 'status'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId: string;

  @Column({ name: 'driver_name', length: 255, nullable: true })
  driverName: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus;

  // Destination coordinates
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  // Current driver coordinates
  @Column({ name: 'current_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLat: number;

  @Column({ name: 'current_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLng: number;

  @Column({ name: 'estimated_minutes', type: 'int', nullable: true })
  estimatedMinutes: number;

  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  deliveryAddress: string;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone: string;

  @Column({ name: 'assigned_at', type: 'timestamptz', nullable: true })
  assignedAt: Date;

  @Column({ name: 'picked_up_at', type: 'timestamptz', nullable: true })
  pickedUpAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
