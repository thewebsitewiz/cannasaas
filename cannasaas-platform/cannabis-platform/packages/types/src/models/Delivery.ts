import type { Address } from './User';

export interface DeliveryZone {
  id: string;
  dispensaryId: string;
  name: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedMinutes: number;
  isActive: boolean;
  // PostGIS polygon stored as GeoJSON
  polygon: GeoJSON.Polygon;
}

export interface Driver {
  id: string;
  dispensaryId: string;
  userId: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  currentLat?: number;
  currentLng?: number;
  updatedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  driverId: string;
  assignedAt: string;
  estimatedArrivalAt: string;
  completedAt?: string;
}
