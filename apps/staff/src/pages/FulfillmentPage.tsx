import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../lib/graphql-client';
import { useAuthStore } from '../stores/auth.store';
import { Truck, Store, Clock, MapPin } from 'lucide-react';

export function FulfillmentPage() {
  const dispensaryId = useAuthStore((s) => s.user?.dispensaryId);

  const { data: zones } = useQuery({
    queryKey: ['deliveryZones', dispensaryId],
    queryFn: () => gqlRequest<{ deliveryZones: any[] }>(`
      query($id: ID!) { deliveryZones(dispensaryId: $id) { zoneId name radiusMiles deliveryFee minOrderAmount freeDeliveryThreshold } }
    `, { id: dispensaryId }),
    select: (d) => d.deliveryZones,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['fulfillmentDashboard'],
    queryFn: () => gqlRequest<{ dashboard: any }>(`
      query { dashboard(days: 1) { sales { completedOrders pendingOrders } } }
    `),
    select: (d) => d.dashboard,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const { data: pickupSlots } = useQuery({
    queryKey: ['pickupSlots', dispensaryId, dateStr],
    queryFn: () => gqlRequest<{ availableTimeSlots: any[] }>(`
      query($id: ID!, $type: String!, $date: String!) {
        availableTimeSlots(dispensaryId: $id, slotType: $type, date: $date) { slotId startTime endTime spotsRemaining }
      }
    `, { id: dispensaryId, type: 'pickup', date: dateStr }),
    select: (d) => d.availableTimeSlots,
  });

  const { data: deliverySlots } = useQuery({
    queryKey: ['deliverySlots', dispensaryId, dateStr],
    queryFn: () => gqlRequest<{ availableTimeSlots: any[] }>(`
      query($id: ID!, $type: String!, $date: String!) {
        availableTimeSlots(dispensaryId: $id, slotType: $type, date: $date) { slotId startTime endTime spotsRemaining }
      }
    `, { id: dispensaryId, type: 'delivery', date: dateStr }),
    select: (d) => d.availableTimeSlots,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fulfillment</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Store size={20} className="text-brand-600" />
          <div>
            <p className="text-lg font-bold">{dashboard?.sales?.completedOrders ?? 0}</p>
            <p className="text-xs text-gray-500">Completed Today</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Clock size={20} className="text-amber-500" />
          <div>
            <p className="text-lg font-bold">{dashboard?.sales?.pendingOrders ?? 0}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <Truck size={20} className="text-indigo-500" />
          <div>
            <p className="text-lg font-bold">{zones?.length ?? 0}</p>
            <p className="text-xs text-gray-500">Delivery Zones</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
          <MapPin size={20} className="text-red-500" />
          <div>
            <p className="text-lg font-bold">{zones ? Math.max(...zones.map((z: any) => z.radiusMiles)) : 0} mi</p>
            <p className="text-xs text-gray-500">Max Radius</p>
          </div>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Zones</h2>
        {zones && zones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {zones.map((z: any) => (
              <div key={z.zoneId} className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{z.name}</h3>
                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                  <p>Radius: {z.radiusMiles} mi</p>
                  <p>Fee: {z.deliveryFee > 0 ? `$${z.deliveryFee}` : 'Free'}</p>
                  <p>Min order: ${z.minOrderAmount}</p>
                  {z.freeDeliveryThreshold && <p>Free above: ${z.freeDeliveryThreshold}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No delivery zones configured</p>
        )}
      </div>

      {/* Time Slots for Tomorrow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pickup Slots — {dateStr}</h2>
          {pickupSlots && pickupSlots.length > 0 ? (
            <div className="space-y-2">
              {pickupSlots.map((s: any) => (
                <div key={s.slotId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium">{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
                  <span className={`text-xs font-semibold ${s.spotsRemaining <= 2 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.spotsRemaining} spots
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No pickup slots</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Delivery Slots — {dateStr}</h2>
          {deliverySlots && deliverySlots.length > 0 ? (
            <div className="space-y-2">
              {deliverySlots.map((s: any) => (
                <div key={s.slotId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium">{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
                  <span className={`text-xs font-semibold ${s.spotsRemaining <= 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {s.spotsRemaining} spots
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No delivery slots</p>
          )}
        </div>
      </div>
    </div>
  );
}
