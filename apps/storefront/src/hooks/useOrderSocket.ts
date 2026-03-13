import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface OrderUpdate {
  type: string;
  orderId: string;
  status: string;
  dispensaryId?: string;
  timestamp: string;
}

interface DeliveryUpdate {
  type: string;
  tripId: string;
  driverId: string;
  status: string;
  lat?: number;
  lng?: number;
  timestamp: string;
}

export function useOrderSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<OrderUpdate | null>(null);
  const [lastDelivery, setLastDelivery] = useState<DeliveryUpdate | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('order:update', (data: OrderUpdate) => {
      setLastUpdate(data);
    });

    socket.on('delivery:update', (data: DeliveryUpdate) => {
      setLastDelivery(data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const subscribeToOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('subscribe:order', { orderId });
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    socketRef.current?.emit('unsubscribe:order', { orderId });
  }, []);

  return { connected, lastUpdate, lastDelivery, subscribeToOrder, unsubscribeFromOrder };
}
