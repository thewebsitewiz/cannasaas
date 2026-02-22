/**
 * @file ComplianceLogRow.tsx
 * @description Table row for the Compliance Log table (GET /compliance/logs).
 *
 * Accessibility:
 *   - Rendered inside <tbody> — parent must be a proper <table> with
 *     <thead> containing column headers (WCAG 1.3.1)
 *   - Each <td> uses data-label for mobile card view (CSS-only responsive table)
 *   - Event type badge uses aria-label (colour not sole indicator — WCAG 1.4.1)
 *
 * @pattern Presentational row — receives a ComplianceEvent and renders it
 */

import React, { memo } from 'react';
import type { ComplianceEvent, ComplianceEventType } from '@cannasaas/types';

interface ComplianceLogRowProps {
  event: ComplianceEvent;
}

/** Maps event types to display labels and severity colours */
const EVENT_CONFIG: Partial<Record<ComplianceEventType, { label: string; color: string }>> = {
  order_created:            { label: 'Order Created',         color: 'text-blue-700 bg-blue-50' },
  order_cancelled:          { label: 'Order Cancelled',       color: 'text-red-700 bg-red-50' },
  order_refunded:           { label: 'Order Refunded',        color: 'text-orange-700 bg-orange-50' },
  purchase_limit_exceeded:  { label: 'Limit Exceeded',        color: 'text-red-700 bg-red-50' },
  metrc_sync_failure:       { label: 'Metrc Failure',         color: 'text-red-700 bg-red-50' },
  metrc_sync_success:       { label: 'Metrc Sync OK',         color: 'text-green-700 bg-green-50' },
  age_verification_approved:{ label: 'Age Verified',          color: 'text-green-700 bg-green-50' },
  age_verification_rejected:{ label: 'Age Rejected',          color: 'text-red-700 bg-red-50' },
  inventory_adjusted:       { label: 'Inventory Adjusted',    color: 'text-purple-700 bg-purple-50' },
  login_failure:            { label: 'Login Failure',         color: 'text-amber-700 bg-amber-50' },
};

export const ComplianceLogRow = memo(function ComplianceLogRow({ event }: ComplianceLogRowProps) {
  const config = EVENT_CONFIG[event.eventType] ?? {
    label: event.eventType.replace(/_/g, ' '),
    color: 'text-gray-700 bg-gray-100',
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Timestamp */}
      <td
        data-label="Time"
        className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap"
      >
        <time dateTime={event.occurredAt}>
          {new Date(event.occurredAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </time>
      </td>

      {/* Event type badge */}
      <td data-label="Event" className="px-4 py-3">
        <span
          aria-label={`Event type: ${config.label}`}
          className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${config.color}`}
        >
          {config.label}
        </span>
      </td>

      {/* Actor */}
      <td data-label="Actor" className="px-4 py-3 text-sm text-gray-700">
        {event.actor?.fullName ?? <span className="text-gray-400 italic">System</span>}
      </td>

      {/* Subject */}
      <td data-label="Subject" className="px-4 py-3 text-sm text-gray-700">
        {event.subject?.fullName ?? '—'}
      </td>

      {/* Entity reference */}
      <td data-label="Reference" className="px-4 py-3 text-xs text-gray-500 font-mono">
        {event.entityId?.substring(0, 8) ?? '—'}
      </td>

      {/* Metrc status */}
      <td data-label="Metrc" className="px-4 py-3 text-sm">
        {event.metrcContext ? (
          <span
            aria-label={`Metrc status: ${event.metrcContext.metrcResponseCode === 200 ? 'synced' : 'pending'}`}
            className={event.metrcContext.metrcResponseCode === 200
              ? 'text-green-600'
              : 'text-amber-600'}
          >
            {event.metrcContext.metrcResponseCode === 200 ? '✓ Synced' : '⏳ Pending'}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
});

ComplianceLogRow.displayName = 'ComplianceLogRow';
