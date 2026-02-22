#!/usr/bin/env bash
# =============================================================================
# CannaSaas — Phase D Admin Portal (Part 5): Analytics + Settings Pages
# File: scaffold-admin-part5.sh
#
# Writes:
#   apps/admin/src/
#   ├── components/settings/
#   │   ├── SettingsBranding.tsx      Logo upload, colour pickers, font selector
#   │   ├── SettingsDeliveryZones.tsx Zone list + polygon map + CRUD
#   │   └── SettingsStaff.tsx         Staff table + invite + role management
#   └── pages/
#       ├── Analytics.tsx             5 chart types + export + product table
#       └── Settings.tsx              Tabbed settings (profile/branding/delivery/staff)
# =============================================================================

set -euo pipefail
ROOT="${1:-$(pwd)}"
AD="$ROOT/apps/admin/src"

echo ""
echo "========================================================"
echo "  Phase D Admin Portal — Part 5: Analytics + Settings"
echo "========================================================"

mkdir -p "$AD/components/settings" "$AD/pages"

# =============================================================================
# components/settings/SettingsBranding.tsx
# =============================================================================
cat > "$AD/components/settings/SettingsBranding.tsx" << 'TSEOF'
/**
 * @file SettingsBranding.tsx
 * @app apps/admin
 *
 * Branding configuration panel inside the Settings page.
 *
 * Three sub-sections:
 *
 * 1. LOGO UPLOAD
 *    Drag-and-drop zone + file input fallback.
 *    Previews existing logo; uploads to S3 via POST /dispensaries/:id/branding/logo.
 *    Accepted: PNG, SVG, WebP, JPEG · Max 2MB.
 *
 * 2. COLOUR PALETTE
 *    Three brand colours: primary, secondary, accent.
 *    Each: native <input type="color"> paired with a hex text input.
 *    A mini "sample button" previews how the colour looks in context.
 *
 * 3. FONT SELECTION
 *    Dropdown from curated 8-font list.
 *    Preview paragraph updates live via inline style.
 *
 * Changes are collected by the parent Settings form and saved via
 *   PUT /dispensaries/:id/branding { primaryColor, secondaryColor, accentColor, fontFamily, logoUrl }
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Logo drop zone: role="region" aria-label, keyboard activated via Enter/Space (2.1.1)
 *   - Each colour input: htmlFor label (1.3.5); native picker + hex text input side-by-side
 *   - Sample buttons are aria-hidden (decorative previews) (1.1.1)
 *   - Font preview: aria-hidden (decorative) (1.1.1)
 *   - Upload progress: aria-live="polite" (4.1.3)
 */

import { useState, useRef, useId } from 'react';
import { useFormContext } from 'react-hook-form';

const FONTS = [
  { label: 'System UI (default)', value: 'system-ui' },
  { label: 'Inter',               value: 'Inter' },
  { label: 'DM Sans',             value: 'DM Sans' },
  { label: 'Plus Jakarta Sans',   value: 'Plus Jakarta Sans' },
  { label: 'Nunito',              value: 'Nunito' },
  { label: 'Poppins',             value: 'Poppins' },
  { label: 'Merriweather',        value: 'Merriweather' },
];

interface ColorRowProps { label: string; value: string; onChange: (v: string) => void }

function ColorRow({ label, value, onChange }: ColorRowProps) {
  const pickerId = useId();
  const hexId    = useId();
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-stone-700 w-20 flex-shrink-0">{label}</span>
      <label htmlFor={pickerId} className="sr-only">{label} colour picker</label>
      <input id={pickerId} type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-1" />
      <label htmlFor={hexId} className="sr-only">{label} hex value</label>
      <input id={hexId} type="text" value={value}
        onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
        maxLength={7} placeholder="#000000"
        className="w-24 px-2.5 py-1.5 text-sm font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary,154_40%_30%)/0.4)] uppercase" />
      <div aria-hidden="true" className="flex items-center gap-2 overflow-hidden">
        <span className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: value }}>Button</span>
        <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: value }} />
      </div>
    </div>
  );
}

interface SettingsBrandingProps { dispensaryId: string; existingLogoUrl?: string }

export function SettingsBranding({ dispensaryId, existingLogoUrl }: SettingsBrandingProps) {
  const { register, watch, setValue } = useFormContext();
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadMsg,   setUploadMsg]   = useState('');
  const [logoPreview, setLogoPreview] = useState(existingLogoUrl ?? '');
  const fileRef = useRef<HTMLInputElement>(null);
  const fontId  = useId();

  const primary   = watch('primaryColor')   ?? '#1f6342';
  const secondary = watch('secondaryColor') ?? '#f59e0b';
  const accent    = watch('accentColor')    ?? '#3b82f6';
  const font      = watch('fontFamily')     ?? 'system-ui';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
    setUploading(true);
    setUploadMsg('Uploading logo…');
    setLogoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res  = await fetch(`/api/v1/dispensaries/${dispensaryId}/branding/logo`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { setValue('logoUrl', data.url); setLogoPreview(data.url); setUploadMsg('Logo uploaded.'); }
    } catch { setUploadMsg('Upload failed. Please try again.'); }
    finally   { setUploading(false); setTimeout(() => setUploadMsg(''), 3000); }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">Branding</h3>

      {/* Logo */}
      <div>
        <p className="text-xs font-semibold text-stone-700 mb-2">Dispensary Logo</p>
        <div className="flex items-start gap-4">
          <div aria-hidden="true" className="w-16 h-16 rounded-xl border-2 border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-2xl">🏪</span>}
          </div>
          <div
            role="region" aria-label="Logo upload area. Drag and drop or press Enter to browse." aria-busy={uploading}
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={['flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))]',
              isDragOver ? 'border-[hsl(var(--primary,154_40%_30%))] bg-[hsl(var(--primary,154_40%_30%)/0.03)]' : 'border-stone-200 hover:border-stone-300'].join(' ')}
          >
            <p className="text-xs text-stone-500">{uploading ? 'Uploading…' : isDragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">PNG, SVG, WebP · Max 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" aria-label="Select logo image" className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        <p aria-live="polite" className="text-xs text-stone-500 mt-1">{uploadMsg}</p>
      </div>

      {/* Colours */}
      <div>
        <p className="text-xs font-semibold text-stone-700 mb-3">Brand Colours</p>
        <div className="space-y-3">
          <ColorRow label="Primary"   value={primary}   onChange={(v) => setValue('primaryColor', v)} />
          <ColorRow label="Secondary" value={secondary} onChange={(v) => setValue('secondaryColor', v)} />
          <ColorRow label="Accent"    value={accent}    onChange={(v) => setValue('accentColor', v)} />
        </div>
      </div>

      {/* Font */}
      <div>
        <label htmlFor={fontId} className="block text-xs font-semibold text-stone-700 mb-1.5">Storefront Font</label>
        <select id={fontId} {...register('fontFamily')}
          className="py-2 pl-3 pr-8 text-sm border border-stone-200 rounded-xl bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 w-56"
          style={{ fontFamily: font }}>
          {FONTS.map((f) => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
        </select>
      </div>

      {/* Live preview */}
      <div aria-hidden="true" className="rounded-2xl border border-stone-200 p-4 bg-white">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-3">Preview</p>
        <div style={{ fontFamily: font }} className="space-y-2">
          <div className="flex items-center gap-2">
            {logoPreview
              ? <img src={logoPreview} alt="" className="w-7 h-7 rounded object-contain" />
              : <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primary }}>D</div>}
            <span className="text-sm font-bold" style={{ color: primary }}>Your Dispensary</span>
          </div>
          <div className="flex gap-2">
            <button style={{ backgroundColor: primary }} className="px-3 py-1 text-white text-xs font-semibold rounded-lg">Shop Now</button>
            <button style={{ borderColor: secondary, color: secondary }} className="px-3 py-1 text-xs font-semibold rounded-lg border">Learn More</button>
            <button style={{ backgroundColor: accent }} className="px-3 py-1 text-white text-xs font-semibold rounded-lg">Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
TSEOF
echo "  ✓ components/settings/SettingsBranding.tsx"

# =============================================================================
# components/settings/SettingsDeliveryZones.tsx
# =============================================================================
cat > "$AD/components/settings/SettingsDeliveryZones.tsx" << 'TSEOF'
/**
 * @file SettingsDeliveryZones.tsx
 * @app apps/admin
 *
 * Delivery zone management inside the Settings page.
 *
 * Features:
 *   - Zone list showing name, fee, min order, estimated delivery time
 *   - Create zone form (name, fee, min order, ETA minutes)
 *   - Delete zone with ConfirmDialog
 *
 * Map integration note:
 *   A full Leaflet + leaflet-draw polygon editor would render in the blue
 *   placeholder region. The component provides a skip link so keyboard users
 *   can bypass the map entirely and use the text-based zone form instead.
 *
 * API:
 *   GET    /delivery/zones          → list zones
 *   POST   /delivery/zones          → create zone
 *   DELETE /delivery/zones/:id      → delete zone
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Map region: role="img" aria-label + skip link (2.1.1)
 *   - Zone list: role="list" + role="listitem" (1.3.1)
 *   - Delete button: aria-label includes zone name (4.1.2)
 *   - Form inputs: htmlFor labels + aria-required (1.3.5)
 *   - Confirm dialog: focus trap on open (2.1.2)
 */

import { useState, useId } from 'react';
import { useDeliveryZones, useCreateDeliveryZone, useDeleteDeliveryZone } from '@cannasaas/api-client';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Zone {
  id: string; name: string;
  deliveryFee: number; minOrderValue: number; estimatedMinutes: number;
}

export function SettingsDeliveryZones() {
  const { data: zones = [], isLoading, refetch } = useDeliveryZones();
  const { mutate: createZone, isPending: isCreating } = useCreateDeliveryZone();
  const { mutate: deleteZone, isPending: isDeleting } = useDeleteDeliveryZone();

  const [showForm,       setShowForm]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', deliveryFee: 5, minOrderValue: 30, estimatedMinutes: 45 });

  const nameId = useId(); const feeId = useId(); const minId = useId(); const etaId = useId();
  const inputCls = 'w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary,154_40%_30%)/0.4)]';

  const handleCreate = () => {
    if (!form.name) return;
    createZone({ ...form, polygon: { type: 'Polygon', coordinates: [] } }, {
      onSuccess: () => { refetch(); setShowForm(false); setForm({ name: '', deliveryFee: 5, minOrderValue: 30, estimatedMinutes: 45 }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <h3 className="text-sm font-bold text-stone-900">Delivery Zones</h3>
        <button type="button" onClick={() => setShowForm((s) => !s)}
          className="px-3 py-2 text-sm font-semibold bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all">
          {showForm ? '✕ Cancel' : '+ Add Zone'}
        </button>
      </div>

      {/* Map placeholder */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-200">
        <a href="#zones-list" className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:top-2 focus:left-2 focus:bg-white focus:text-stone-900 focus:px-3 focus:py-1.5 focus:rounded-lg focus:shadow-lg focus:text-sm">
          Skip map and go to zone list
        </a>
        <div role="img" aria-label="Delivery zone polygon map — use the list below to manage zones" className="h-52 bg-gradient-to-br from-blue-50 to-stone-100 flex items-center justify-center">
          <div className="text-center">
            <span aria-hidden="true" className="text-4xl block mb-2">🗺️</span>
            <p className="text-xs font-medium text-stone-600">Interactive polygon editor</p>
            <p className="text-[10px] text-stone-400 mt-0.5">react-leaflet + leaflet-draw renders here</p>
          </div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border border-[hsl(var(--primary,154_40%_30%)/0.2)] rounded-2xl p-4 bg-[hsl(var(--primary,154_40%_30%)/0.02)] space-y-3">
          <p className="text-xs font-bold text-stone-700">New Delivery Zone</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label htmlFor={nameId} className="block text-xs font-semibold text-stone-600 mb-1">Zone Name <span aria-hidden="true" className="text-red-500">*</span></label>
              <input id={nameId} type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Brooklyn North" className={inputCls} /></div>
            <div><label htmlFor={minId} className="block text-xs font-semibold text-stone-600 mb-1">Min Order ($)</label>
              <input id={minId} type="number" min="0" step="5" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: +e.target.value }))} className={inputCls} /></div>
            <div><label htmlFor={feeId} className="block text-xs font-semibold text-stone-600 mb-1">Delivery Fee ($)</label>
              <input id={feeId} type="number" min="0" step="0.5" value={form.deliveryFee} onChange={(e) => setForm((f) => ({ ...f, deliveryFee: +e.target.value }))} className={inputCls} /></div>
            <div><label htmlFor={etaId} className="block text-xs font-semibold text-stone-600 mb-1">Estimated Time (min)</label>
              <input id={etaId} type="number" min="10" step="5" value={form.estimatedMinutes} onChange={(e) => setForm((f) => ({ ...f, estimatedMinutes: +e.target.value }))} className={inputCls} /></div>
          </div>
          <button type="button" onClick={handleCreate} disabled={!form.name || isCreating}
            className="px-4 py-2 text-sm font-semibold bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all">
            {isCreating ? 'Creating…' : 'Create Zone'}
          </button>
        </div>
      )}

      {/* Zones list */}
      <div id="zones-list">
        {isLoading ? (
          <div className="flex items-center justify-center h-24" aria-busy="true"><LoadingSpinner label="Loading zones…" /></div>
        ) : (zones as Zone[]).length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-6">No delivery zones configured.</p>
        ) : (
          <ul role="list" className="space-y-2">
            {(zones as Zone[]).map((z) => (
              <li key={z.id} role="listitem" className="flex items-center justify-between gap-4 p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{z.name}</p>
                  <p className="text-xs text-stone-400">Min ${z.minOrderValue} · Fee ${z.deliveryFee} · ~{z.estimatedMinutes} min</p>
                </div>
                <button type="button" onClick={() => setConfirmDelete(z.id)} aria-label={`Delete zone ${z.name}`}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400">
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteZone(confirmDelete!, { onSuccess: () => { setConfirmDelete(null); refetch(); } })}
        title="Delete Delivery Zone"
        description="This zone will be removed. Existing orders in this zone will not be affected."
        confirmLabel="Delete Zone" isLoading={isDeleting} />
    </div>
  );
}
TSEOF
echo "  ✓ components/settings/SettingsDeliveryZones.tsx"

# =============================================================================
# components/settings/SettingsStaff.tsx
# =============================================================================
cat > "$AD/components/settings/SettingsStaff.tsx" << 'TSEOF'
/**
 * @file SettingsStaff.tsx
 * @app apps/admin
 *
 * Staff account management inside the Settings page.
 *
 * Features:
 *   - Staff table: name, email, role badge, status, last login
 *   - Invite new staff: email + role dropdown → POST /users
 *   - Change role inline: select dropdown → PUT /users/:id/roles
 *   - Deactivate / reactivate → PUT /users/:id { isActive }
 *
 * Roles available to assign: admin | manager | budtender | driver
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Table: <table> with <caption> (1.3.1)
 *   - Role selects: aria-label includes staff name (4.1.2)
 *   - Action buttons: aria-label includes staff name (4.1.2)
 *   - Invite form: labeled inputs, aria-required (1.3.5)
 *   - Table loading: aria-busy (4.1.2)
 */

import { useState, useId } from 'react';
import { useStaffUsers, useInviteUser, useUpdateUserRole, useToggleUserActive } from '@cannasaas/api-client';
import { StatusBadge } from '../ui/StatusBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

type StaffRole = 'admin' | 'manager' | 'budtender' | 'driver';

interface StaffMember {
  id: string; firstName: string; lastName: string;
  email: string; roles: StaffRole[]; isActive: boolean; lastLoginAt?: string;
}

const ROLE_COLORS: Record<StaffRole, string> = {
  admin:     'bg-purple-100 text-purple-700',
  manager:   'bg-blue-100 text-blue-700',
  budtender: 'bg-green-100 text-green-700',
  driver:    'bg-amber-100 text-amber-700',
};

export function SettingsStaff() {
  const { data: staff = [], isLoading, refetch } = useStaffUsers();
  const { mutate: inviteUser,  isPending: isInviting } = useInviteUser();
  const { mutate: updateRole } = useUpdateUserRole();
  const { mutate: toggleActive } = useToggleUserActive();

  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'manager' as StaffRole });

  const emailId = useId();
  const roleId  = useId();

  const inputCls  = 'w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary,154_40%_30%)/0.4)]';
  const selectCls = 'text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 text-stone-700';

  const handleInvite = () => {
    if (!invite.email) return;
    inviteUser({ email: invite.email, roles: [invite.role] }, {
      onSuccess: () => { refetch(); setShowInvite(false); setInvite({ email: '', role: 'manager' }); },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
        <h3 className="text-sm font-bold text-stone-900">Staff Accounts</h3>
        <button type="button" onClick={() => setShowInvite((s) => !s)}
          className="px-3 py-2 text-sm font-semibold bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all">
          {showInvite ? '✕ Cancel' : '+ Invite Staff'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="border border-[hsl(var(--primary,154_40%_30%)/0.2)] rounded-2xl p-4 bg-[hsl(var(--primary,154_40%_30%)/0.02)] space-y-3">
          <p className="text-xs font-bold text-stone-700">Invite New Staff Member</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor={emailId} className="block text-xs font-semibold text-stone-600 mb-1">
                Email Address <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input id={emailId} type="email" required aria-required="true" value={invite.email}
                onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
                placeholder="staff@dispensary.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor={roleId} className="block text-xs font-semibold text-stone-600 mb-1">Role</label>
              <select id={roleId} value={invite.role} onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value as StaffRole }))}
                className={selectCls + ' py-2 pl-3 pr-8'}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="budtender">Budtender</option>
                <option value="driver">Driver</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={handleInvite} disabled={!invite.email || isInviting}
            className="px-4 py-2 text-sm font-semibold bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all">
            {isInviting ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      )}

      {/* Staff table */}
      <div aria-busy={isLoading} className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Staff accounts list</caption>
          <thead>
            <tr className="border-b border-stone-100">
              <th scope="col" className="text-left pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">Staff Member</th>
              <th scope="col" className="text-left pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
              <th scope="col" className="pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Last Login</th>
              <th scope="col" className="pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider w-8"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} aria-hidden="true">
                <td className="py-3"><div className="h-4 w-32 bg-stone-100 rounded animate-pulse motion-reduce:animate-none" /></td>
                <td className="py-3 hidden sm:table-cell"><div className="h-5 w-16 bg-stone-100 rounded-full animate-pulse" /></td>
                <td className="py-3 hidden md:table-cell"><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></td>
                <td />
              </tr>
            )) : (staff as StaffMember[]).map((member) => {
              const fullName    = `${member.firstName} ${member.lastName}`;
              const primaryRole = member.roles[0] ?? 'budtender';
              return (
                <tr key={member.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-xs font-semibold text-stone-900">{fullName}</p>
                    <p className="text-[10px] text-stone-400">{member.email}</p>
                  </td>
                  <td className="py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${ROLE_COLORS[primaryRole as StaffRole] ?? 'bg-stone-100 text-stone-600'}`}>
                        {primaryRole}
                      </span>
                      {!member.isActive && <StatusBadge status="inactive" />}
                    </div>
                  </td>
                  <td className="py-3 hidden md:table-cell">
                    {member.lastLoginAt ? (
                      <time dateTime={member.lastLoginAt} className="text-[10px] text-stone-400">
                        {new Date(member.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </time>
                    ) : <span className="text-[10px] text-stone-300">Never</span>}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <select
                        value={primaryRole}
                        onChange={(e) => updateRole({ userId: member.id, role: e.target.value as StaffRole }, { onSuccess: refetch })}
                        aria-label={`Change role for ${fullName}`}
                        className={selectCls + ' py-1 pl-2 pr-5 text-[10px]'}>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="budtender">Budtender</option>
                        <option value="driver">Driver</option>
                      </select>
                      <button type="button"
                        onClick={() => toggleActive({ userId: member.id, isActive: !member.isActive }, { onSuccess: refetch })}
                        aria-label={member.isActive ? `Deactivate ${fullName}` : `Reactivate ${fullName}`}
                        className={['text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1',
                          member.isActive ? 'text-red-600 hover:bg-red-50 focus-visible:ring-red-400' : 'text-green-600 hover:bg-green-50 focus-visible:ring-green-400'].join(' ')}>
                        {member.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && (staff as StaffMember[]).length === 0 && (
          <p className="text-sm text-stone-400 text-center py-6">No staff members yet. Invite someone to get started.</p>
        )}
      </div>
    </div>
  );
}
TSEOF
echo "  ✓ components/settings/SettingsStaff.tsx"

# =============================================================================
# pages/Analytics.tsx
# =============================================================================
cat > "$AD/pages/Analytics.tsx" << 'TSEOF'
/**
 * @file Analytics.tsx
 * @app apps/admin
 *
 * Extended analytics dashboard page.
 *
 * Layout (responsive):
 *   Row 1: 4 KPI StatsCards with range selector + CSV Export button
 *   Row 2: Revenue over time — AreaChart (full width)
 *   Row 3: Orders by fulfillment (BarChart 1/2) | Top products pie (PieChart 1/2)
 *   Row 4: Customer acquisition (LineChart 1/2) | Conversion funnel (custom 1/2)
 *   Row 5: Product performance table (full width)
 *
 * Data sources:
 *   GET /analytics/dashboard?range=30d   → KPIs, revenue by day, top products
 *   GET /analytics/products?range=30d    → product performance table
 *   GET /analytics/customers?range=30d   → acquisition/funnel
 *   GET /analytics/export?format=csv     → CSV blob download
 *
 * Each chart has:
 *   - role="img" aria-label summarising the data (WCAG 1.1.1)
 *   - <details> data table alternative for screen readers (WCAG 1.1.1)
 *
 * Accessibility (WCAG 2.1 AA):
 *   - document.title updated (2.4.2)
 *   - Range selector: role="radiogroup" (4.1.2)
 *   - CSV export: aria-live announces state changes (4.1.3)
 *   - Chart colours + separate legends / labels (1.4.1)
 *   - prefers-reduced-motion: disables Recharts animation (2.3.3)
 */

import { useState, useEffect, useId } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import {
  useDashboardAnalytics, useAnalyticsProducts,
  useAnalyticsCustomers, useExportAnalytics,
} from '@cannasaas/api-client';
import { PageHeader } from '../components/ui/PageHeader';
import { StatsCard }  from '../components/ui/StatsCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

type DateRange = '7d' | '30d' | '90d' | '12m';
const RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }, { value: '12m', label: '12 months' },
];

const PALETTE = [
  'hsl(154,40%,30%)', 'hsl(215,70%,55%)', 'hsl(270,50%,60%)',
  'hsl(35,80%,55%)',  'hsl(0,65%,55%)',
];

const noAnim = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Compact tooltip */
function ChartTip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-stone-100 rounded-xl shadow-lg p-3 text-xs">
      {label && <p className="font-semibold text-stone-700 mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>
          {p.name}: {fmt ? fmt(p.value) : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/** Reusable chart card with loading, aria wrapper, and data table toggle */
function ChartCard({ title, ariaLabel, loading, children, tableAlt, className = '' }: {
  title: string; ariaLabel: string; loading?: boolean;
  children: React.ReactNode; tableAlt?: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm p-5 ${className}`}>
      <h2 className="text-sm font-bold text-stone-900 mb-4">{title}</h2>
      {loading ? (
        <div className="flex items-center justify-center h-52" aria-busy="true">
          <LoadingSpinner label={`Loading ${title}…`} />
        </div>
      ) : (
        <>
          <div role="img" aria-label={ariaLabel} className="h-52">{children}</div>
          {tableAlt && (
            <details className="mt-3">
              <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 focus-visible:outline-none focus-visible:underline">View data table</summary>
              <div className="overflow-x-auto mt-2 text-xs">{tableAlt}</div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

/** Horizontal funnel bars */
function Funnel({ steps, loading }: { steps?: { label: string; value: number; pct: number }[]; loading?: boolean }) {
  const defaults = [
    { label: 'Visitors', value: 0, pct: 100 },
    { label: 'Product Views', value: 0, pct: 0 },
    { label: 'Add to Cart', value: 0, pct: 0 },
    { label: 'Checkout', value: 0, pct: 0 },
    { label: 'Orders', value: 0, pct: 0 },
  ];
  const data = steps ?? defaults;
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
      <h2 className="text-sm font-bold text-stone-900 mb-4">Conversion Funnel</h2>
      {loading ? <div className="flex items-center justify-center h-52" aria-busy="true"><LoadingSpinner label="Loading funnel…" /></div> : (
        <ol role="list" className="space-y-3 mt-2">
          {data.map((step, i) => (
            <li key={step.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-stone-700">{step.label}</span>
                <span className="text-stone-400">{step.value.toLocaleString()} ({step.pct.toFixed(1)}%)</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${step.pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const [range, setRange] = useState<DateRange>('30d');
  const [csvState, setCsvState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const rangeId = useId();
  const skip    = noAnim();

  useEffect(() => { document.title = 'Analytics | CannaSaas Admin'; }, []);

  const { data: dash, isLoading: dL }  = useDashboardAnalytics({ range });
  const { data: prods, isLoading: pL } = useAnalyticsProducts({ range });
  const { data: custs, isLoading: cL } = useAnalyticsCustomers({ range });
  const { mutate: exportCsv }          = useExportAnalytics();

  // Chart data transforms
  const revData = (dash?.revenue?.byDay ?? []).map((d: any) => ({
    date:    new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue ?? 0, orders: d.orders ?? 0,
  }));
  const fulfData  = [
    { name: 'Pickup',   value: dash?.fulfillmentSplit?.pickup   ?? 0 },
    { name: 'Delivery', value: dash?.fulfillmentSplit?.delivery ?? 0 },
  ];
  const topPie = (dash?.topProducts ?? []).slice(0, 5).map((p: any) => ({ name: p.name, value: p.revenue ?? 0 }));
  const acqData = (custs?.acquisition ?? []).map((d: any) => ({
    date:      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    new:       d.new ?? 0, returning: d.returning ?? 0,
  }));

  const $f = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const $k = (n: number) => `$${(n / 1000).toFixed(1)}k`;

  const handleExport = () => {
    setCsvState('loading');
    exportCsv({ range }, {
      onSuccess: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href: url, download: `analytics-${range}.csv` });
        a.click();
        URL.revokeObjectURL(url);
        setCsvState('done');
        setTimeout(() => setCsvState('idle'), 4000);
      },
      onError: () => { setCsvState('error'); setTimeout(() => setCsvState('idle'), 5000); },
    });
  };

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <PageHeader title="Analytics" description="Dispensary performance metrics" />
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {/* Range */}
          <div role="radiogroup" id={rangeId} aria-label="Analytics date range" className="flex items-center bg-stone-100 rounded-xl p-0.5">
            {RANGES.map((r) => (
              <button key={r.value} type="button" role="radio" aria-checked={range === r.value}
                onClick={() => setRange(r.value)}
                className={['px-3 py-1.5 text-xs font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400',
                  range === r.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'].join(' ')}>
                {r.label}
              </button>
            ))}
          </div>
          {/* CSV export */}
          <button type="button" onClick={handleExport} disabled={csvState === 'loading'}
            aria-busy={csvState === 'loading'} aria-label="Export analytics as CSV file"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border border-stone-200 rounded-xl bg-white hover:bg-stone-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 transition-all">
            <span aria-hidden="true">{csvState === 'loading' ? '⏳' : csvState === 'done' ? '✅' : '⬇️'}</span>
            {csvState === 'loading' ? 'Exporting…' : csvState === 'done' ? 'Downloaded!' : 'Export CSV'}
          </button>
          <span aria-live="polite" className="sr-only">
            {csvState === 'loading' ? 'Preparing CSV…' : csvState === 'done' ? 'CSV ready.' : csvState === 'error' ? 'Export failed.' : ''}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <section aria-label="Key performance indicators">
        <h2 className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Total Revenue"   value={dash ? $f(dash.revenue?.total ?? 0) : '$0'}         change={dash?.revenue?.change}        changeLabel="vs prev period" icon="💰" isLoading={dL} />
          <StatsCard title="Total Orders"    value={dash ? (dash.orders?.total ?? 0).toLocaleString() : '0'} change={dash?.orders?.change}     changeLabel="vs prev period" icon="📦" isLoading={dL} />
          <StatsCard title="New Customers"   value={custs ? (custs.newCount ?? 0).toLocaleString() : '0'} change={custs?.newChange}           changeLabel="vs prev period" icon="👥" isLoading={cL} />
          <StatsCard title="Avg Order Value" value={dash ? $f(dash.avgOrderValue?.value ?? 0) : '$0'}    change={dash?.avgOrderValue?.change}  changeLabel="vs prev period" icon="🧾" isLoading={dL} />
        </div>
      </section>

      {/* Revenue area chart */}
      <ChartCard title="Revenue Over Time"
        ariaLabel={`Revenue area chart for last ${range}. Total: ${$f(dash?.revenue?.total ?? 0)}`}
        loading={dL}
        tableAlt={
          <table className="w-full">
            <caption className="sr-only">Daily revenue data</caption>
            <thead><tr className="border-b border-stone-100"><th scope="col" className="text-left py-1 pr-3 text-stone-500">Date</th><th scope="col" className="text-right py-1 text-stone-500">Revenue</th><th scope="col" className="text-right py-1 text-stone-500">Orders</th></tr></thead>
            <tbody>{revData.map((r) => <tr key={r.date}><td className="py-1 pr-3 text-stone-600">{r.date}</td><td className="py-1 text-right">{$f(r.revenue)}</td><td className="py-1 text-right">{r.orders}</td></tr>)}</tbody>
          </table>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={PALETTE[0]} stopOpacity={0.15} />
                <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={$k} width={44} />
            <Tooltip content={<ChartTip fmt={$f} />} cursor={{ stroke: '#e7e5e4', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={PALETTE[0]} strokeWidth={2} fill="url(#rg)" dot={false} isAnimationActive={!skip()} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Fulfillment + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Orders by Fulfillment Type"
          ariaLabel={`Bar chart: ${fulfData.map((f) => `${f.name} ${f.value}`).join(', ')} orders`}
          loading={dL}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fulfData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" name="Orders" isAnimationActive={!skip()} radius={[6, 6, 0, 0]}>
                {fulfData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Products by Revenue"
          ariaLabel={`Pie chart: ${topPie.map((p) => `${p.name} ${$f(p.value)}`).join(', ')}`}
          loading={dL}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={topPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                isAnimationActive={!skip()}
                label={({ name, percent }) => `${String(name).slice(0, 8)} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {topPie.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<ChartTip fmt={$f} />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Customer acquisition + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Customer Acquisition"
          ariaLabel={`Line chart of new and returning customers over last ${range}`}
          loading={cL}
          tableAlt={
            <table className="w-full">
              <caption className="sr-only">Customer acquisition by day</caption>
              <thead><tr className="border-b border-stone-100"><th scope="col" className="text-left py-1 pr-3 text-stone-500">Date</th><th scope="col" className="text-right py-1 text-stone-500">New</th><th scope="col" className="text-right py-1 text-stone-500">Returning</th></tr></thead>
              <tbody>{acqData.map((d) => <tr key={d.date}><td className="py-1 pr-3 text-stone-600">{d.date}</td><td className="py-1 text-right">{d.new}</td><td className="py-1 text-right">{d.returning}</td></tr>)}</tbody>
            </table>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={acqData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#e7e5e4' }} />
              <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="new"       name="New"       stroke={PALETTE[0]} strokeWidth={2} dot={false} isAnimationActive={!skip()} />
              <Line type="monotone" dataKey="returning" name="Returning" stroke={PALETTE[1]} strokeWidth={2} dot={false} strokeDasharray="4 3" isAnimationActive={!skip()} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <Funnel steps={custs?.funnel} loading={cL} />
      </div>

      {/* Product performance table */}
      <section aria-label="Product performance table">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-stone-900 mb-4">Product Performance</h2>
          {pL ? (
            <div className="flex items-center justify-center h-32" aria-busy="true"><LoadingSpinner label="Loading products…" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Product performance for selected period</caption>
                <thead>
                  <tr className="border-b border-stone-100">
                    <th scope="col" className="text-left pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="text-right pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Units</th>
                    <th scope="col" className="text-right pb-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">Revenue</th>
                    <th scope="col" className="pb-2 w-28 hidden md:table-cell"><span className="sr-only">Revenue share</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {(prods?.data ?? []).map((p: any, i: number) => {
                    const maxR  = Math.max(...(prods?.data ?? []).map((x: any) => x.revenue), 1);
                    const share = ((p.revenue / maxR) * 100).toFixed(0);
                    return (
                      <tr key={p.productId} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true" className="text-xs font-bold text-stone-300 w-4 text-center">{i + 1}</span>
                            <p className="text-xs font-semibold text-stone-800">{p.name}</p>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-xs text-stone-500 hidden sm:table-cell">{p.quantity?.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-xs font-bold">{$f(p.revenue)}</td>
                        <td className="py-2.5 hidden md:table-cell pl-4">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden" aria-hidden="true">
                              <div className="h-full bg-[hsl(var(--primary,154_40%_30%))] rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-[10px] text-stone-400 w-6 text-right">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
TSEOF
echo "  ✓ pages/Analytics.tsx"

# =============================================================================
# pages/Settings.tsx
# =============================================================================
cat > "$AD/pages/Settings.tsx" << 'TSEOF'
/**
 * @file Settings.tsx
 * @app apps/admin
 *
 * Settings page — tabbed management panel.
 *
 * Four tabs:
 *   1. Profile    — dispensary name, operating hours, contact info, license
 *   2. Branding   — SettingsBranding component (logo, colours, font)
 *   3. Delivery   — SettingsDeliveryZones component
 *   4. Staff      — SettingsStaff component
 *
 * Profile form fields:
 *   - Dispensary name (text, required)
 *   - Phone (tel input)
 *   - Email (email input)
 *   - Website (url input)
 *   - License number (read-only — set at company level)
 *   - Operating hours: per-day open/close time selects, closed toggle
 *
 * Submit: PUT /dispensaries/:id with the full form body.
 *
 * Uses React Hook Form with FormProvider so sub-components (SettingsBranding)
 * can access the form context via useFormContext().
 *
 * Auto-saves indication: "Saved ✓" toast appears for 3 seconds after PUT.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - document.title updated (2.4.2)
 *   - Tabs: role="tablist" / role="tab" / role="tabpanel" with aria-selected (4.1.2)
 *   - Tab panel: aria-labelledby links panel to its tab (1.3.1)
 *   - Hours form: fieldset per day with <legend> (1.3.1)
 *   - Save button: aria-busy during save (4.1.2)
 *   - Success toast: role="status" aria-live="polite" (4.1.3)
 */

import { useState, useEffect, useId } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useDispensary, useUpdateDispensary } from '@cannasaas/api-client';
import { useOrganizationStore } from '@cannasaas/stores';
import { PageHeader }             from '../components/ui/PageHeader';
import { LoadingSpinner }         from '../components/ui/LoadingSpinner';
import { SettingsBranding }       from '../components/settings/SettingsBranding';
import { SettingsDeliveryZones }  from '../components/settings/SettingsDeliveryZones';
import { SettingsStaff }          from '../components/settings/SettingsStaff';

type TabId = 'profile' | 'branding' | 'delivery' | 'staff';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',  label: 'Profile',  icon: '🏪' },
  { id: 'branding', label: 'Branding', icon: '🎨' },
  { id: 'delivery', label: 'Delivery', icon: '🚗' },
  { id: 'staff',    label: 'Staff',    icon: '👥' },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
type Day = typeof DAYS[number];

const HOURS = Array.from({ length: 29 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  const hh = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${hh}:${m} ${ampm}` };
});

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const tablistId = useId();
  const { dispensary } = useOrganizationStore();

  const { data: settings, isLoading } = useDispensary(dispensary?.id ?? '');
  const { mutate: updateDispensary, isPending: isSaving } = useUpdateDispensary(dispensary?.id ?? '');

  useEffect(() => { document.title = 'Settings | CannaSaas Admin'; }, []);

  const methods = useForm({ defaultValues: { name: '', phone: '', email: '', website: '', primaryColor: '#1f6342', secondaryColor: '#f59e0b', accentColor: '#3b82f6', fontFamily: 'system-ui', logoUrl: '', hours: {} as Record<Day, { open: string; close: string; closed: boolean }> } });
  const { register, handleSubmit, reset, formState: { isDirty } } = methods;

  useEffect(() => { if (settings) reset(settings); }, [settings, reset]);

  const onSubmit = (data: any) => {
    setSaveStatus('saving');
    updateDispensary(data, {
      onSuccess: () => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 3000); },
      onError:   () => { setSaveStatus('error');  setTimeout(() => setSaveStatus('idle'), 5000); },
    });
  };

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:border-[hsl(var(--primary,154_40%_30%)/0.4)]';

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" label="Loading settings…" /></div>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <PageHeader title="Settings" description="Manage your dispensary configuration" />
          <div className="flex items-center gap-3 flex-shrink-0">
            <span aria-live="polite" role="status" className="text-xs font-medium">
              {saveStatus === 'saved' && <span className="text-green-600">✓ Saved</span>}
              {saveStatus === 'error' && <span className="text-red-600">Save failed</span>}
            </span>
            <button type="submit" disabled={isSaving || !isDirty} aria-busy={isSaving}
              className="px-4 py-2 text-sm font-bold bg-[hsl(var(--primary,154_40%_30%))] text-white rounded-xl hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] transition-all">
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div role="tablist" id={tablistId} aria-label="Settings sections"
          className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto pb-px">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" role="tab"
              id={`stab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`spanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={['flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary,154_40%_30%))] focus-visible:ring-inset',
                activeTab === tab.id ? 'border-[hsl(var(--primary,154_40%_30%))] text-[hsl(var(--primary,154_40%_30%))]' : 'border-transparent text-stone-500 hover:text-stone-700'].join(' ')}>
              <span aria-hidden="true">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          {/* Profile */}
          <div role="tabpanel" id="spanel-profile" aria-labelledby="stab-profile" hidden={activeTab !== 'profile'}>
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">Dispensary Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Dispensary Name <span aria-hidden="true" className="text-red-500">*</span></label>
                  <input {...register('name', { required: true })} type="text" placeholder="Green Leaf Brooklyn" className={inputCls} required />
                </div>
                <div><label className="block text-xs font-semibold text-stone-700 mb-1.5">Phone</label>
                  <input {...register('phone')} type="tel" placeholder="+1 (718) 555-0100" className={inputCls} /></div>
                <div><label className="block text-xs font-semibold text-stone-700 mb-1.5">Email</label>
                  <input {...register('email')} type="email" placeholder="contact@dispensary.com" className={inputCls} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-semibold text-stone-700 mb-1.5">Website</label>
                  <input {...register('website')} type="url" placeholder="https://www.dispensary.com" className={inputCls} /></div>
                {settings?.licenseNumber && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-stone-700 mb-1.5">License Number</p>
                    <p className="font-mono text-sm text-stone-600 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2.5">{settings.licenseNumber}</p>
                    <p className="text-[10px] text-stone-400 mt-1">License is set at the company level. Contact your account manager to update.</p>
                  </div>
                )}
              </div>

              {/* Operating hours */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 mb-3">Operating Hours</h4>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <fieldset key={day} className="flex items-center gap-3 flex-wrap">
                      <legend className="text-xs font-semibold text-stone-700 w-24 flex-shrink-0">{day.slice(0, 3)}</legend>
                      <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                        <input {...register(`hours.${day}.closed`)} type="checkbox"
                          className="w-3.5 h-3.5 rounded text-[hsl(var(--primary,154_40%_30%))]" />
                        Closed
                      </label>
                      <div className="flex items-center gap-2">
                        <select {...register(`hours.${day}.open`)} aria-label={`${day} opening time`}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 text-stone-700">
                          {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                        <span aria-hidden="true" className="text-stone-400 text-xs">–</span>
                        <select {...register(`hours.${day}.close`)} aria-label={`${day} closing time`}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-1 text-stone-700">
                          {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div role="tabpanel" id="spanel-branding" aria-labelledby="stab-branding" hidden={activeTab !== 'branding'}>
            <SettingsBranding dispensaryId={dispensary?.id ?? ''} existingLogoUrl={settings?.logoUrl} />
          </div>

          {/* Delivery zones */}
          <div role="tabpanel" id="spanel-delivery" aria-labelledby="stab-delivery" hidden={activeTab !== 'delivery'}>
            <SettingsDeliveryZones />
          </div>

          {/* Staff */}
          <div role="tabpanel" id="spanel-staff" aria-labelledby="stab-staff" hidden={activeTab !== 'staff'}>
            <SettingsStaff />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
TSEOF
echo "  ✓ pages/Settings.tsx"

echo ""
echo "  ✅ Admin Part 5 complete — Analytics + Settings"
find "$AD/components/settings" "$AD/pages/Analytics.tsx" "$AD/pages/Settings.tsx" \
  -type f 2>/dev/null | sort | sed "s|$ROOT/||" | sed 's/^/    /'
echo ""
