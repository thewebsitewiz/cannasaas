import { useEffect, useState } from 'react';

import { useAuthStore } from '../stores/auth.store';
import { getAdminSocket } from '../lib/socket-client';

export interface StockAlert {
  type: 'low_stock' | 'out_of_stock';
  productName: string;
  quantity: number;
  timestamp: string;
}

interface InventoryAlertPayload {
  type: 'low_stock' | 'out_of_stock';
  productName: string;
  quantity: number;
  timestamp: string;
}

/**
 * Subscribes to `inventory:alert` on the staff WS room and accumulates
 * the latest alert per productName (newer alerts replace older ones —
 * an `out_of_stock` event supersedes a prior `low_stock` for the same
 * product).
 *
 * The hook is a passive listener; the initial dashboard data still
 * comes from the existing `dashboard.lowStockItems` REST query.
 */
export function useStockAlerts(): StockAlert[] {
  const token = useAuthStore((s) => s.token);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    if (!token) return;
    const socket = getAdminSocket(token);

    const handler = (payload: InventoryAlertPayload) => {
      setAlerts((prev) => {
        const filtered = prev.filter(
          (a) => a.productName !== payload.productName,
        );
        return [payload, ...filtered].slice(0, 20);
      });
    };

    socket.on('inventory:alert', handler);
    return () => {
      socket.off('inventory:alert', handler);
    };
  }, [token]);

  return alerts;
}
