import { useEffect, useState } from 'react';
import { useStaffSocket } from '../hooks/useStaffSocket';
import { useAuthStore } from '../stores/auth.store';
import { ShoppingCart, AlertTriangle, Truck, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'order' | 'inventory' | 'delivery';
  message: string;
  timestamp: string;
}

export function OrderToast() {
  const token = useAuthStore((s) => s.token);
  const { connected, newOrders, inventoryAlerts, deliveryUpdates, clearNewOrders } = useStaffSocket(token);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // New order toast
  useEffect(() => {
    if (newOrders.length > 0) {
      const latest = newOrders[0];
      const t: Toast = {
        id: latest.orderId + Date.now(),
        type: 'order',
        message: 'New ' + (latest.orderType || 'pickup') + ' order — $' + (latest.total || '?'),
        timestamp: latest.timestamp,
      };
      setToasts(prev => [t, ...prev].slice(0, 5));

      // Play sound
      try { new Audio('data:audio/wav;base64,UklGRl9vT19teletrXYZZZ==').play().catch(() => {}); } catch {}
    }
  }, [newOrders]);

  // Inventory alert toast
  useEffect(() => {
    if (inventoryAlerts.length > 0) {
      const latest = inventoryAlerts[0];
      setToasts(prev => [{
        id: 'inv-' + Date.now(),
        type: 'inventory',
        message: 'Low stock: ' + latest.productName + ' (' + latest.quantity + ' left)',
        timestamp: latest.timestamp,
      }, ...prev].slice(0, 5));
    }
  }, [inventoryAlerts]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(0, -1));
    }, 8000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { order: ShoppingCart, inventory: AlertTriangle, delivery: Truck };
  const colors = { order: 'bg-brand-600', inventory: 'bg-amber-500', delivery: 'bg-blue-500' };

  return (
    <>
      {/* Connection indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + (connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
          {connected ? '● Live' : '○ Disconnected'}
        </span>
      </div>

      {/* Toast stack */}
      <div className="fixed top-16 right-4 z-50 space-y-2 w-80">
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          return (
            <div key={toast.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex items-center gap-3 animate-slide-in">
              <div className={'w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ' + colors[toast.type]}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{toast.message}</p>
                <p className="text-[10px] text-gray-400">{new Date(toast.timestamp).toLocaleTimeString()}</p>
              </div>
              <button onClick={() => dismiss(toast.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
