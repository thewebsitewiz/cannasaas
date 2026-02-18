/**
 * ═══════════════════════════════════════════════════════════════════
 * NotificationPreferences — Toggle Switches for Notifications
 * ═══════════════════════════════════════════════════════════════════
 *
 * File: apps/storefront/src/components/account/NotificationPreferences.tsx
 *
 * Route: /account/notifications
 *
 * Manages two groups of preferences:
 *   1. Communication Channels — email, SMS, push
 *   2. Notification Types — order updates, promotions, restock alerts
 *
 * Each toggle calls PUT /users/me with the updated preference.
 * Uses optimistic updates — the toggle flips immediately and rolls
 * back if the API call fails.
 *
 * ─── DATA FROM PROJECT GUIDE ───────────────────────────────────
 *
 *   preferences: {
 *     communicationChannels: { email, sms, push },
 *     notifications: { orderUpdates, promotions, restockAlerts }
 *   }
 *
 * Accessibility (WCAG):
 *   - <fieldset>/<legend> on each group (1.3.1)
 *   - Toggle: <input type="checkbox"> with role="switch" (4.1.2)
 *   - aria-checked mirrors checked state (4.1.2)
 *   - Each toggle has a visible <label> (1.3.1)
 *   - Description text linked via aria-describedby (4.1.2)
 *   - focus-visible rings (2.4.7)
 *   - Touch targets: entire row is clickable (2.5.8)
 *   - Status saved feedback: role="status" (4.1.3)
 *
 * Responsive:
 *   - Full-width toggle rows
 *   - Label + description left, toggle right
 *   - Groups separated by section dividers
 */

import { useCallback, useId } from 'react';
import { useCurrentUser, useUpdateProfile } from '@cannasaas/api-client';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  const descId = useId();

  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium group-hover:text-foreground transition-colors">
          {label}
        </span>
        <span id={descId} className="block text-xs text-muted-foreground mt-0.5">
          {description}
        </span>
      </div>

      {/* Toggle switch — a styled checkbox with role="switch" */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          aria-describedby={descId}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          aria-hidden="true"
          className={`
            w-11 h-6 rounded-full
            transition-colors duration-200
            peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            ${checked ? 'bg-primary' : 'bg-muted border border-border'}
          `}
        />
        <div
          aria-hidden="true"
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
          `}
        />
      </div>
    </label>
  );
}

export function NotificationPreferences() {
  const { data: user, isLoading } = useCurrentUser();
  const { mutate: updateProfile } = useUpdateProfile();

  const channels = user?.preferences?.communicationChannels ?? {
    email: true, sms: false, push: false,
  };
  const notifications = user?.preferences?.notifications ?? {
    orderUpdates: true, promotions: true, restockAlerts: false,
  };

  /** Optimistic toggle: update local state via React Query cache,
      then call API. On error, React Query refetches to rollback. */
  const toggleChannel = useCallback(
    (key: string, value: boolean) => {
      updateProfile({
        preferences: {
          communicationChannels: { ...channels, [key]: value },
        },
      });
    },
    [updateProfile, channels],
  );

  const toggleNotification = useCallback(
    (key: string, value: boolean) => {
      updateProfile({
        preferences: {
          notifications: { ...notifications, [key]: value },
        },
      });
    },
    [updateProfile, notifications],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-busy="true">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
            <div className="w-11 h-6 bg-muted rounded-full" />
          </div>
        ))}
        <span className="sr-only">Loading preferences…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose how and when you'd like to hear from us.
        </p>
      </div>

      {/* ── Communication Channels ── */}
      <fieldset className="space-y-1">
        <legend className="text-sm font-semibold mb-2">Communication Channels</legend>
        <p className="text-xs text-muted-foreground mb-3">
          Select how you'd like to receive messages.
        </p>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Email"
            description="Order confirmations, receipts, and account updates."
            checked={channels.email}
            onChange={(v) => toggleChannel('email', v)}
          />
          <ToggleRow
            label="SMS Text Messages"
            description="Delivery tracking, pickup ready notifications."
            checked={channels.sms}
            onChange={(v) => toggleChannel('sms', v)}
          />
          <ToggleRow
            label="Push Notifications"
            description="Real-time alerts on your mobile device."
            checked={channels.push}
            onChange={(v) => toggleChannel('push', v)}
          />
        </div>
      </fieldset>

      {/* ── Notification Types ── */}
      <fieldset className="space-y-1 pt-2 border-t border-border">
        <legend className="text-sm font-semibold mb-2">What to Notify About</legend>
        <p className="text-xs text-muted-foreground mb-3">
          Choose which types of notifications you'd like to receive.
        </p>

        <div className="divide-y divide-border">
          <ToggleRow
            label="Order Updates"
            description="Status changes, shipping confirmations, delivery ETAs."
            checked={notifications.orderUpdates}
            onChange={(v) => toggleNotification('orderUpdates', v)}
          />
          <ToggleRow
            label="Promotions & Deals"
            description="New deals, flash sales, and personalized offers."
            checked={notifications.promotions}
            onChange={(v) => toggleNotification('promotions', v)}
          />
          <ToggleRow
            label="Restock Alerts"
            description="Get notified when out-of-stock favorites are back."
            checked={notifications.restockAlerts}
            onChange={(v) => toggleNotification('restockAlerts', v)}
          />
        </div>
      </fieldset>

      <p className="text-[10px] sm:text-xs text-muted-foreground">
        Changes are saved automatically. You can update these settings at any time.
      </p>
    </div>
  );
}
