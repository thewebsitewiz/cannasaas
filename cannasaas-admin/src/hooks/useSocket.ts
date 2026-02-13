// cannasaas-storefront/src/hooks/useSocket.ts  (identical copy in cannasaas-admin)
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';

export function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socket = io(`${import.meta.env.VITE_API_URL}/ws`, {
      auth: { token }, transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [token]);

  const subscribe = (event: string, handler: (data: any) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  };

  return { connected, subscribe };
}
