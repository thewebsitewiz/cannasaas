import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface OrderEvent {
  type: string;
  orderId: string;
  status: string;
  dispensaryId?: string;
  total?: number;
  orderType?: string;
  timestamp: string;
}

interface InventoryAlert {
  type: string;
  productName: string;
  quantity: number;
  timestamp: string;
}

interface DeliveryUpdate {
  type: string;
  tripId: string;
  driverId: string;
  status: string;
  timestamp: string;
}

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export function useStaffSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [newOrders, setNewOrders] = useState<OrderEvent[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<OrderEvent[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [deliveryUpdates, setDeliveryUpdates] = useState<DeliveryUpdate[]>([]);
  const [driverLocations, setDriverLocations] = useState<Map<string, DriverLocation>>(new Map());

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('order:new', (data: OrderEvent) => {
      setNewOrders(prev => [data, ...prev].slice(0, 50));
    });

    socket.on('order:update', (data: OrderEvent) => {
      setOrderUpdates(prev => [data, ...prev].slice(0, 50));
    });

    socket.on('inventory:alert', (data: InventoryAlert) => {
      setInventoryAlerts(prev => [data, ...prev].slice(0, 20));
    });

    socket.on('delivery:update', (data: DeliveryUpdate) => {
      setDeliveryUpdates(prev => [data, ...prev].slice(0, 20));
    });

    socket.on('driver:location', (data: DriverLocation) => {
      setDriverLocations(prev => new Map(prev).set(data.driverId, data));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const clearNewOrders = useCallback(() => setNewOrders([]), []);
  const clearAlerts = useCallback(() => setInventoryAlerts([]), []);

  return {
    connected,
    newOrders,
    orderUpdates,
    inventoryAlerts,
    deliveryUpdates,
    driverLocations,
    clearNewOrders,
    clearAlerts,
  };
}
