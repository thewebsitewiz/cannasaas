/**
 * ═══════════════════════════════════════════════════════════════════
 * CustomerDetail.tsx — Customer Profile Detail
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/admin/src/pages/Customers/CustomerDetail.tsx
 *
 * Sections:
 *  - Customer header with verification status + lifetime value
 *  - Order history table
 *  - Loyalty & stats panel
 *  - Verification management (age / medical card approval)
 *
 * API:
 *  GET  /users/:id            (Sprint 2)
 *  GET  /orders?customerId=:id (Sprint 5)
 *  POST /age-verification/verify (Sprint 7)
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Phone, MapPin, ShieldCheck, ShieldAlert,
  ShieldX, Star, Calendar, Package, DollarSign, TrendingUp,
  Clock, CheckCircle2, Truck, XCircle, UserCheck, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@cannasaas/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: { street: string; city: string; state: string; zip: string };
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  isMedicalPatient: boolean;
  medicalCardExpiry?: string;
  orderCount: number;
  lifetimeValue: number;
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  averageOrderValue: number;
  lastOrderAt: string | null;
  createdAt: string;
  purchaseLimitStatus: {
    flowerOzRemaining: number;
    concentrateGRemaining: number;
    windowHours: number;
  };
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

// ─── Tier Config ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: 'text-amber-600',   bg: 'bg-amber-900/20 border-amber-800/30' },
  silver:   { label: 'Silver',   color: 'text-slate-300',   bg: 'bg-slate-700/50 border-slate-600/30' },
  gold:     { label: 'Gold',     color: 'text-yellow-400',  bg: 'bg-yellow-900/20 border-yellow-700/30' },
  platinum: { label: 'Platinum', color: 'text-cyan-300',    bg: 'bg-cyan-900/20 border-cyan-700/30' },
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:          'text-yellow-300',
  confirmed:        'text-blue-300',
  preparing:        'text-purple-300',
  ready_for_pickup: 'text-amber-300',
  out_for_delivery: 'text-cyan-300',
  completed:        'text-emerald-300',
  cancelled:        'text-red-300',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function ProfileStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
      <div className="p-2 rounded-lg bg-slate-800">
        <Icon className="h-4 w-4 text-amber-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-white font-mono">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyType, setVerifyType] = useState<'age' | 'medical'>('age');

  const { data: customer, isLoading } = useQuery<CustomerProfile>({
    queryKey: ['customer', id],
    queryFn: () => apiClient.get(`/users/${id}`).then(r => r.data),
  });

  const { data: orders } = useQuery<OrderSummary[]>({
    queryKey: ['customer-orders', id],
    queryFn: () => apiClient.get(`/orders?customerId=${id}&limit=10&sort=createdAt_desc`).then(r => r.data.data),
    enabled: !!id,
  });

  const verifyMutation = useMutation({
    mutationFn: (type: 'age' | 'medical') =>
      apiClient.post('/age-verification/verify', {
        customerId: id,
        verificationType: type === 'medical' ? 'medical_card' : 'age',
        verified: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setShowVerifyDialog(false);
      toast({ title: 'Customer verified successfully' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 space-y-6">
        <Skeleton className="h-10 w-48 bg-slate-800" />
        <Skeleton className="h-36 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 bg-slate-800 rounded-xl" />
          <Skeleton className="h-48 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const tierConfig = TIER_CONFIG[customer.loyaltyTier];

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}
          className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Customers
        </Button>
      </div>

      {/* ── Profile Card ── */}
      <Card className="bg-slate-900 border-slate-800 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-200">
                {customer.firstName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{customer.firstName} {customer.lastName}</h1>
                <p className="text-slate-400 text-sm">{customer.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {/* Verification badge */}
                  {customer.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-900/20 border border-emerald-800/30 text-emerald-300 text-xs rounded-full">
                      <ShieldCheck className="h-3 w-3" /> ID Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-full">
                      <ShieldAlert className="h-3 w-3" /> Unverified
                    </span>
                  )}
                  {/* Medical badge */}
                  {customer.isMedicalPatient && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/20 border border-blue-800/30 text-blue-300 text-xs rounded-full">
                      Medical Patient
                    </span>
                  )}
                  {/* Loyalty tier */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-xs rounded-full ${tierConfig.color} ${tierConfig.bg}`}>
                    <Star className="h-3 w-3" /> {tierConfig.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!customer.isVerified && (
                <Button size="sm" onClick={() => { setVerifyType('age'); setShowVerifyDialog(true); }}
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white">
                  <UserCheck className="h-3.5 w-3.5" /> Verify Age ID
                </Button>
              )}
              {!customer.isMedicalPatient && (
                <Button size="sm" variant="outline" onClick={() => { setVerifyType('medical'); setShowVerifyDialog(true); }}
                  className="gap-1.5 border-blue-700/50 text-blue-400 hover:bg-blue-900/20">
                  Approve Medical Card
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <ProfileStat icon={ShoppingCart} label="Total Orders" value={String(customer.orderCount)} />
        <ProfileStat icon={DollarSign} label="Lifetime Value" value={formatCurrency(customer.lifetimeValue)} />
        <ProfileStat icon={TrendingUp} label="Avg Order Value" value={formatCurrency(customer.averageOrderValue)} />
        <ProfileStat icon={Star} label="Loyalty Points" value={customer.loyaltyPoints.toLocaleString()} />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Order History ── */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Order History</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {!orders ? (
                <div className="px-4 pb-4 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 bg-slate-800 rounded-lg" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="px-4 pb-8 text-center text-slate-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {orders.map(order => (
                    <Link key={order.id} to={`/orders/${order.id}`} className="block hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-amber-400">{order.orderNumber}</span>
                            <span className={`text-xs font-medium ${ORDER_STATUS_COLOR[order.status] ?? 'text-slate-400'}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {order.itemCount} items · {order.fulfillmentMethod} · {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-mono text-sm text-white">{formatCurrency(order.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Info Cards ── */}
        <div className="space-y-4">

          {/* Contact */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-300 truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-300">{customer.phone}</span>
              </div>
              {customer.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-300">
                    {customer.address.street}<br />
                    {customer.address.city}, {customer.address.state} {customer.address.zip}
                  </span>
                </div>
              )}
              {customer.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-slate-300">DOB: {formatDate(customer.dateOfBirth)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 text-xs">Joined {formatDate(customer.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification status */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Verification</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Age (21+) ID</span>
                {customer.isVerified ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified {formatDate(customer.verifiedAt)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <ShieldX className="h-3.5 w-3.5" /> Not verified
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Medical Card</span>
                {customer.isMedicalPatient ? (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {customer.medicalCardExpiry ? `Exp ${formatDate(customer.medicalCardExpiry)}` : 'Active'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Recreational</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase Limits */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Purchase Limits</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <p className="text-xs text-slate-500">{customer.purchaseLimitStatus.windowHours}h rolling window remaining:</p>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Flower</span>
                  <span className="text-white font-mono">{customer.purchaseLimitStatus.flowerOzRemaining.toFixed(1)} oz left</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min((customer.purchaseLimitStatus.flowerOzRemaining / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Concentrate</span>
                  <span className="text-white font-mono">{customer.purchaseLimitStatus.concentrateGRemaining.toFixed(1)} g left</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-purple-500 transition-all"
                    style={{ width: `${Math.min((customer.purchaseLimitStatus.concentrateGRemaining / 24) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Verify Dialog ── */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {verifyType === 'age' ? 'Approve Age Verification' : 'Approve Medical Card'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-amber-900/10 border border-amber-800/30 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                {verifyType === 'age'
                  ? 'Confirm you have physically checked a valid government-issued ID and the customer is 21+. This is legally required.'
                  : 'Confirm you have reviewed a valid medical cannabis card and it is not expired.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowVerifyDialog(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={() => verifyMutation.mutate(verifyType)}
              disabled={verifyMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {verifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Need ShoppingCart import
function ShoppingCart(props: any) { return <Package {...props} />; }
