/**
 * @file DriverCard.tsx
 * @description Driver status card for the Delivery Management page.
 *
 * Displays:
 *   - Driver avatar, name, vehicle
 *   - Current status with colour indicator
 *   - Active order reference (if en_route)
 *   - Location last-updated timestamp
 *
 * Accessibility:
 *   - <article> with aria-label for landmark navigation
 *   - Status conveyed via text + colour (not colour alone — WCAG 1.4.1)
 *   - Avatar image has descriptive alt text
 *
 * @pattern Presentational — receives Driver prop, emits onAssign callback
 */

import React, { memo } from 'react';
import type { Driver, DriverStatus } from '@cannasaas/types';

interface DriverCardProps {
  driver: Driver;
  onAssign?: (driverId: string) => void;
}

const STATUS_CONFIG: Record<DriverStatus, { label: string; dot: string; bg: string }> = {
  offline:    { label: 'Offline',          dot: 'bg-gray-400',   bg: 'bg-gray-50' },
  available:  { label: 'Available',        dot: 'bg-green-500',  bg: 'bg-green-50' },
  en_route:   { label: 'En Route',         dot: 'bg-blue-500',   bg: 'bg-blue-50' },
  returning:  { label: 'Returning',        dot: 'bg-indigo-500', bg: 'bg-indigo-50' },
  break:      { label: 'On Break',         dot: 'bg-yellow-500', bg: 'bg-yellow-50' },
};

export const DriverCard = memo(function DriverCard({ driver, onAssign }: DriverCardProps) {
  const statusCfg = STATUS_CONFIG[driver.status];

  return (
    <article
      aria-label={`Driver ${driver.user.fullName}, status: ${statusCfg.label}`}
      className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3"
    >
      {/* Header: avatar + name + status */}
      <div className="flex items-center gap-3">
        {driver.user.avatarUrl ? (
          <img
            src={driver.user.avatarUrl}
            alt={`${driver.user.fullName}'s profile photo`}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 text-sm font-semibold"
          >
            {driver.user.fullName.charAt(0)}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {driver.user.fullName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {driver.vehicle
              ? `${driver.vehicle.year} ${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model}`
              : 'Vehicle not listed'}
          </p>
        </div>

        {/* Status badge — text + dot, colour not sole indicator */}
        <span
          aria-label={`Status: ${statusCfg.label}`}
          className={`ml-auto inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg}`}
        >
          <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-gray-500">Deliveries</dt>
          <dd className="font-semibold text-gray-900">{driver.totalDeliveries}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Rating</dt>
          <dd className="font-semibold text-gray-900">
            {driver.averageRating != null
              ? `${driver.averageRating.toFixed(1)} ⭐`
              : 'No ratings yet'}
          </dd>
        </div>
      </dl>

      {/* Active order reference */}
      {driver.activeOrderId && (
        <p className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
          🚗 Active order: <strong>#{driver.activeOrderId.substring(0, 8)}</strong>
        </p>
      )}

      {/* Location timestamp */}
      {driver.currentLocation && (
        <p className="text-xs text-gray-400">
          Location updated{' '}
          <time dateTime={driver.currentLocation.updatedAt}>
            {new Date(driver.currentLocation.updatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </time>
        </p>
      )}

      {/* Assign button — only shown when driver is available */}
      {driver.status === 'available' && onAssign && (
        <button
          type="button"
          onClick={() => onAssign(driver.id)}
          aria-label={`Assign order to ${driver.user.fullName}`}
          className={[
            'w-full py-2 px-4 text-sm font-medium rounded-lg',
            'bg-[hsl(var(--primary))] text-white',
            'hover:brightness-110 active:brightness-95',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2',
            'transition-all',
          ].join(' ')}
        >
          Assign Order
        </button>
      )}
    </article>
  );
});

DriverCard.displayName = 'DriverCard';
