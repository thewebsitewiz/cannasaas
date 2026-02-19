/**
 * ═══════════════════════════════════════════════════════════════════
 * OrderDetail.tsx — Order Detail View
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Orders/OrderDetail.tsx
 *
 * Features:
 *  - Status timeline (vertical progress indicator)
 *  - Customer info card
 *  - Items snapshot
 *  - Payment details
 *  - Fulfillment tracking (delivery assignment)
 *  - Staff status update actions
 *  - Cancel with refund
 *
 * API:
 *  GET  /orders/:id               (Sprint 5)
 *  PUT  /orders/:id/status        (Sprint 5)
 *  POST /orders/:id/refund        (Sprint 6)
 *  POST /delivery/assign          (Sprint 10)
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle2, Truck, Package, XCircle,
  User, MapPin, CreditCard, Phone, Mail, RefreshCw,
  AlertTriangle, Loader2, ChevronDown, Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thcContent?: number;
  imageUrl?: string;
  category: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: 'pickup' | 'delivery';
  customer: {
    id: string; firstName: string; lastName: string;
    email: string; phone: string;
    isVerified: boolean; loyaltyPoints: number;
  };
  deliveryAddress?: {
    street: string; unit?: string; city: string; state: string; zip: string;
  };
  items: OrderItem[];
  subtotal: number;
  promoDiscount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  stripePaymentIntentId?: string;
  notes?: string;
  driver?: { name: string; phone: string; licensePlate?: string };
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: string; timestamp: string; performedBy?: string; note?: string }[];
}

// ─── Status Timeline ──────────────────────────────────────────────────────────

const STATUS_STEPS = {
  pickup: [
    { key: 'pending',          label: 'Order Placed',     icon: Clock },
    { key: 'confirmed',        label: 'Confirmed',         icon: CheckCircle2 },
    { key: 'preparing',        label: 'Preparing',         icon: Package },
    { key: 'ready_for_pickup', label: 'Ready for Pickup',  icon: CheckCircle2 },
    { key: 'completed',        label: 'Completed',         icon: CheckCircle2 },
  ],
  delivery: [
    { key: 'pending',          label: 'Order Placed',      icon: Clock },
    { key: 'confirmed',        label: 'Confirmed',         icon: CheckCircle2 },
    { key: 'preparing',        label: 'Preparing',         icon: Package },
    { key: 'out_for_delivery', label: 'Out for Delivery',  icon: Truck },
    { key: 'completed',        label: 'Delivered',         icon: CheckCircle2 },
  ],
};

function StatusTimeline({ order }: { order: OrderDetail }) {
  const steps = STATUS_STEPS[order.fulfillmentMethod] ?? STATUS_STEPS.pickup;
  const isCancelled = order.status === 'cancelled';
  const isRefunded  = order.status === 'refunded';

  const currentIdx = isCancelled || isRefunded
    ? -1
    : steps.findIndex(s => s.key === order.status);

  return (
    <div className="space-y-2">
      {isCancelled || isRefunded ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300 capitalize">{order.status}</p>
            <p className="text-xs text-red-400/70">
              {order.statusHistory.find(h => h.status === order.status)?.timestamp
                ? new Date(order.statusHistory.find(h => h.status === order.status)!.timestamp).toLocaleString()
                : ''}
            </p>
          </div>
        </div>
      ) : (
        steps.map((step, idx) => {
          const isDone    = idx < currentIdx;
          const isActive  = idx === currentIdx;
          const isPending = idx > currentIdx;
          const histEntry = order.statusHistory.find(h => h.status === step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex gap-3">
              {/* Icon + line */}
              <div className="flex flex-col items-center">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                  isActive  ? 'bg-amber-500 border-amber-500 text-slate-950' :
                  isDone    ? 'bg-emerald-600/30 border-emerald-600 text-emerald-400' :
                              'bg-slate-800 border-slate-700 text-slate-600'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 h-5 my-0.5 ${isDone ? 'bg-emerald-600/40' : 'bg-slate-800'}`} />
                )}
              </div>
              {/* Label */}
              <div className="pb-1">
                <p className={`text-sm font-medium ${isActive ? 'text-amber-400' : isDone ? 'text-white' : 'text-slate-600'}`}>
                  {step.label}
                </p>
                {histEntry && (
                  <p className="text-xs text-slate-500">
                    {new Date(histEntry.timestamp).toLocaleString()}
                    {histEntry.performedBy && ` · ${histEntry.performedBy}`}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [refundFull, setRefundFull] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // ── Data ──
  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then(r => r.data),
  });

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ['drivers', 'available'],
    queryFn: () => apiClient.get('/delivery/drivers?available=true').then(r => r.data),
    enabled: order?.fulfillmentMethod === 'delivery',
  });

  // ── Mutations ──
  const statusMutation = useMutation({
    mutationFn: (status: string) => apiClient.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast({ title: 'Order status updated' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiClient.post(`/orders/${id}/cancel`, { note: cancelNote }),
    onSuccess: () => {
      if (refundFull) {
        apiClient.post(`/orders/${id}/refund`, { amount: order?.total });
      }
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setShowCancelDialog(false);
      toast({ title: refundFull ? 'Order cancelled and refunded' : 'Order cancelled' });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: () => apiClient.post('/delivery/assign', { orderId: id, driverId: selectedDriverId }),
    onSuccess: () => {
      statusMutation.mutate('out_for_delivery');
      setShowDriverDialog(false);
      toast({ title: 'Driver assigned' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 space-y-4">
        <Skeleton className="h-10 w-48 bg-slate-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 bg-slate-800 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isCancelable = ['pending', 'confirmed', 'preparing'].includes(order.status);
  const isDelivery = order.fulfillmentMethod === 'delivery';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Orders
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">{order.orderNumber}</h1>
            <p className="text-slate-400 text-xs">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'pending' && (
            <Button size="sm" onClick={() => statusMutation.mutate('confirmed')}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Order
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button size="sm" onClick={() => statusMutation.mutate('preparing')}
              className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5">
              <Package className="h-3.5 w-3.5" /> Mark Preparing
            </Button>
          )}
          {order.status === 'preparing' && !isDelivery && (
            <Button size="sm" onClick={() => statusMutation.mutate('ready_for_pickup')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Pickup
            </Button>
          )}
          {order.status === 'preparing' && isDelivery && (
            <Button size="sm" onClick={() => setShowDriverDialog(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Assign Driver
            </Button>
          )}
          {(order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') && (
            <Button size="sm" onClick={() => statusMutation.mutate('completed')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
            </Button>
          )}
          {isCancelable && (
            <Button size="sm" variant="outline" onClick={() => setShowCancelDialog(true)}
              className="border-red-800/50 text-red-400 hover:bg-red-900/20 gap-1.5">
              <XCircle className="h-3.5 w-3.5" /> Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Items */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="divide-y divide-slate-800">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-slate-600" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.variantName} {item.thcContent ? `· ${item.thcContent}% THC` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-mono">{formatCurrency(item.totalPrice)}</p>
                      <p className="text-xs text-slate-500">x{item.quantity} · {formatCurrency(item.unitPrice)} ea</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-mono">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Promo Discount</span>
                    <span className="text-emerald-400 font-mono">–{formatCurrency(order.promoDiscount)}</span>
                  </div>
                )}
                {isDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Delivery Fee</span>
                    <span className="text-white font-mono">{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white font-mono">{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-800">
                  <span className="text-white">Total</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-white text-base">Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Method</p>
                  <p className="text-sm text-white capitalize">{order.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`text-sm font-medium ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.stripePaymentIntentId && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Stripe Payment ID</p>
                    <p className="text-xs font-mono text-slate-400">{order.stripePaymentIntentId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          {isDelivery && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-white text-base">Delivery</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {order.deliveryAddress && (
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-white">
                      {order.deliveryAddress.street}
                      {order.deliveryAddress.unit && `, Unit ${order.deliveryAddress.unit}`}
                      <br />
                      {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zip}
                    </p>
                  </div>
                )}
                {order.driver && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs text-slate-500 mb-2">Assigned Driver</p>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-900/30 border border-amber-800/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                        {order.driver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-white">{order.driver.name}</p>
                        <p className="text-xs text-slate-500">{order.driver.phone}</p>
                      </div>
                    </div>
                  </div>
                )}
                {order.estimatedDeliveryTime && (
                  <p className="mt-3 text-xs text-slate-500">
                    ETA: <span className="text-amber-400">{order.estimatedDeliveryTime}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Status Timeline */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <StatusTimeline order={order} />
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-white text-base">Customer</CardTitle>
                </div>
                <Link to={`/customers/${order.customer.id}`} className="text-xs text-amber-400 hover:text-amber-300">
                  View profile →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-slate-300">
                  {order.customer.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {order.customer.firstName} {order.customer.lastName}
                    {order.customer.isVerified && (
                      <span className="ml-2 text-xs text-emerald-400">✓ Verified</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{order.customer.loyaltyPoints.toLocaleString()} pts</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-300">{order.customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-slate-300">{order.customer.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base">Order Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-slate-400">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Cancel Dialog ── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Cancel Order {order.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-red-900/10 border border-red-800/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">This action cannot be easily undone.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-1.5">Cancellation Reason</label>
              <Textarea
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="Customer request, out of stock, etc."
                rows={3}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 resize-none"
              />
            </div>
            {order.paymentStatus === 'paid' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="refund"
                  checked={refundFull}
                  onChange={e => setRefundFull(e.target.checked)}
                  className="rounded border-slate-600"
                />
                <label htmlFor="refund" className="text-sm text-white">
                  Issue full refund ({formatCurrency(order.total)})
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)} className="text-slate-400 hover:text-white">
              Keep Order
            </Button>
            <Button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white gap-2"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assign Driver Dialog ── */}
      <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <p className="text-sm text-slate-400">Select an available driver for this delivery.</p>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Choose driver…" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {(drivers ?? []).map(d => (
                  <SelectItem key={d.id} value={d.id} className="text-white focus:bg-slate-800">
                    {d.name} · {d.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDriverDialog(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={() => assignDriverMutation.mutate()}
              disabled={!selectedDriverId || assignDriverMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
            >
              {assignDriverMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign & Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
