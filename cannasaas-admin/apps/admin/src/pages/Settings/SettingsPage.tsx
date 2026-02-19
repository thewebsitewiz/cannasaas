/**
 * @file SettingsPage.tsx
 * @path apps/admin/src/pages/Settings/SettingsPage.tsx
 *
 * Admin settings page with five sections accessed via a left-side nav:
 *   1. Organization Profile – name, hours, contact info
 *   2. Branding – logo upload, color pickers, font selection
 *   3. Delivery Zones – polygon zone management (map placeholder for PostGIS)
 *   4. Tax Configuration – rate table for product categories
 *   5. Staff Accounts – invite, role assignment, deactivate
 *
 * PATTERN: Each section is a separate component mounted based on the active
 * section key. They each fetch their own data independently so loading
 * one section doesn't delay others.
 *
 * WCAG: The section navigation uses role="navigation" aria-label="Settings".
 * The active section link has aria-current="page". Each section starts
 * with its own <h2> heading.
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../components/shared/PageHeader';
import { FormField } from '../../components/shared/FormField';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAdminUiStore } from '../../stores/adminUiStore';
import type { OrgProfileFormValues, BrandingFormValues, TaxConfig, StaffMember } from '../../types/admin.types';
import styles from './SettingsPage.module.css';

// ─── Section Keys ─────────────────────────────────────────────────────────────

type SettingsSection = 'org' | 'branding' | 'zones' | 'tax' | 'staff';

const SECTIONS: { key: SettingsSection; label: string; icon: string }[] = [
  { key: 'org',      label: 'Organization',    icon: '🏢' },
  { key: 'branding', label: 'Branding',        icon: '🎨' },
  { key: 'zones',    label: 'Delivery Zones',  icon: '🗺️' },
  { key: 'tax',      label: 'Tax Config',      icon: '💰' },
  { key: 'staff',    label: 'Staff Accounts',  icon: '👥' },
];

// ─── Org Profile Section ──────────────────────────────────────────────────────

function OrgProfileSection() {
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OrgProfileFormValues>();

  const onSubmit = async (values: OrgProfileFormValues) => {
    try {
      const res = await fetch('/api/admin/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) toastSuccess('Organization profile updated');
      else toastError('Failed to update profile');
    } catch { toastError('Network error'); }
  };

  return (
    <section aria-labelledby="org-title">
      <h2 id="org-title" className={styles.sectionTitle}>Organization Profile</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.settingsForm} aria-label="Organization profile form">
        <div className={styles.formGrid}>
          <FormField label="Organization Name" required error={errors.name?.message} className={styles.fullWidth}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('name', { required: 'Name is required' })} className={styles.input} type="text" placeholder="Green Leaf Dispensary" />
            )}
          </FormField>
          <FormField label="Phone" error={errors.phone?.message}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('phone')} className={styles.input} type="tel" placeholder="+1 (555) 000-0000" />
            )}
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('email')} className={styles.input} type="email" placeholder="hello@dispensary.com" />
            )}
          </FormField>
          <FormField label="Address Line 1" error={errors.addressLine1?.message} className={styles.fullWidth}>
            {({ id, inputProps }) => (
              <input id={id} {...inputProps} {...register('addressLine1')} className={styles.input} type="text" />
            )}
          </FormField>
          <FormField label="City" error={errors.city?.message}>
            {({ id, inputProps }) => <input id={id} {...inputProps} {...register('city')} className={styles.input} type="text" />}
          </FormField>
          <FormField label="State" error={errors.state?.message}>
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('state')} className={styles.select}>
                <option value="">Select state…</option>
                <option value="NY">New York</option>
                <option value="NJ">New Jersey</option>
                <option value="CT">Connecticut</option>
              </select>
            )}
          </FormField>
          <FormField label="ZIP Code" error={errors.zip?.message}>
            {({ id, inputProps }) => <input id={id} {...inputProps} {...register('zip')} className={styles.input} type="text" maxLength={10} />}
          </FormField>
          <FormField label="Minimum Age Requirement" error={errors.minimumAge?.message}>
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('minimumAge', { valueAsNumber: true })} className={styles.select}>
                <option value={21}>21+ (Recreational)</option>
                <option value={18}>18+ (Medical)</option>
              </select>
            )}
          </FormField>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Branding Section ─────────────────────────────────────────────────────────

function BrandingSection() {
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<BrandingFormValues>({
    defaultValues: { brandColor: '#2D6A4F', accentColor: '#52B788', secondaryColor: '#95D5B2', fontFamily: 'DM Sans' },
  });

  const brandColor = watch('brandColor');
  const accentColor = watch('accentColor');

  const onSubmit = async (values: BrandingFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (k === 'logoFile' && v instanceof File) formData.append('logo', v);
      else if (typeof v === 'string') formData.append(k, v);
    });
    try {
      const res = await fetch('/api/admin/organization/branding', { method: 'PUT', body: formData });
      if (res.ok) toastSuccess('Branding updated');
      else toastError('Failed to update branding');
    } catch { toastError('Network error'); }
  };

  return (
    <section aria-labelledby="branding-title">
      <h2 id="branding-title" className={styles.sectionTitle}>Branding</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.settingsForm} aria-label="Branding configuration form">
        <div className={styles.formGrid}>
          {/* Color pickers */}
          <FormField label="Brand Color" hint="Primary brand color used throughout the storefront.">
            {({ id }) => (
              <div className={styles.colorRow}>
                <input id={id} type="color" {...register('brandColor')} className={styles.colorInput} aria-label="Brand color picker" />
                <span className={styles.colorHex}>{brandColor}</span>
              </div>
            )}
          </FormField>
          <FormField label="Accent Color" hint="Secondary highlight color.">
            {({ id }) => (
              <div className={styles.colorRow}>
                <input id={id} type="color" {...register('accentColor')} className={styles.colorInput} aria-label="Accent color picker" />
                <span className={styles.colorHex}>{accentColor}</span>
              </div>
            )}
          </FormField>
          <FormField label="Font Family">
            {({ id, inputProps }) => (
              <select id={id} {...inputProps} {...register('fontFamily')} className={styles.select}>
                <option value="DM Sans">DM Sans</option>
                <option value="Inter">Inter</option>
                <option value="Nunito">Nunito</option>
                <option value="Raleway">Raleway</option>
              </select>
            )}
          </FormField>
          <FormField label="Logo" hint="Upload PNG or SVG. Recommended: 200×60px.">
            {({ id }) => (
              <input id={id} type="file" accept="image/png,image/svg+xml,image/jpeg" {...register('logoFile')} className={styles.fileInput} aria-label="Upload logo file" />
            )}
          </FormField>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Tax Config Section ───────────────────────────────────────────────────────

function TaxConfigSection() {
  const [taxes, setTaxes] = useState<TaxConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));

  useEffect(() => {
    fetch('/api/admin/tax-configs').then((r) => r.json()).then((d) => { setTaxes(d); setIsLoading(false); });
  }, []);

  const toggleTax = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/tax-configs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      setTaxes((prev) => prev.map((t) => t.id === id ? { ...t, isActive } : t));
      toastSuccess(`Tax rule ${isActive ? 'enabled' : 'disabled'}`);
    } else {
      toastError('Failed to update tax rule');
    }
  };

  return (
    <section aria-labelledby="tax-title">
      <h2 id="tax-title" className={styles.sectionTitle}>Tax Configuration</h2>
      {isLoading ? (
        <p aria-live="polite">Loading tax rules…</p>
      ) : (
        <div className={styles.taxList} role="list">
          {taxes.map((tax) => (
            <div key={tax.id} className={styles.taxItem} role="listitem">
              <div className={styles.taxInfo}>
                <span className={styles.taxLabel}>{tax.label}</span>
                <span className={styles.taxRate}>{tax.ratePct}%</span>
                <span className={styles.taxCategories}>
                  {tax.appliesToCategories.join(', ')}
                </span>
              </div>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={tax.isActive}
                  onChange={(e) => toggleTax(tax.id, e.target.checked)}
                  aria-label={`${tax.isActive ? 'Disable' : 'Enable'} ${tax.label}`}
                />
                <span className={styles.toggleTrack} aria-hidden="true" />
                <span className={styles.srOnly}>{tax.isActive ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Staff Section ────────────────────────────────────────────────────────────

function StaffSection() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffMember['role']>('staff');
  const { toastSuccess, toastError } = useAdminUiStore((s) => ({ toastSuccess: s.toastSuccess, toastError: s.toastError }));

  useEffect(() => {
    fetch('/api/admin/staff').then((r) => r.json()).then((d) => { setStaff(d); setIsLoading(false); });
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/staff/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    if (res.ok) {
      toastSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } else {
      toastError('Failed to send invite');
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (res.ok) {
      setStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, isActive: !s.isActive } : s));
      toastSuccess(`${member.displayName} ${member.isActive ? 'deactivated' : 'activated'}`);
    } else {
      toastError('Failed to update staff member');
    }
  };

  return (
    <section aria-labelledby="staff-title">
      <h2 id="staff-title" className={styles.sectionTitle}>Staff Accounts</h2>

      {/* Invite form */}
      <form onSubmit={handleInvite} className={styles.inviteForm} aria-label="Invite new staff member">
        <label htmlFor="invite-email" className={styles.srOnly}>Email address to invite</label>
        <input
          id="invite-email"
          type="email"
          className={styles.input}
          placeholder="staff@dispensary.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          aria-label="Staff email address"
        />
        <label htmlFor="invite-role" className={styles.srOnly}>Role for new staff member</label>
        <select
          id="invite-role"
          className={styles.select}
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as StaffMember['role'])}
          aria-label="Select role"
        >
          <option value="staff">Staff</option>
          <option value="driver">Driver</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className={styles.saveBtn}>Send Invite</button>
      </form>

      {/* Staff list */}
      {isLoading ? (
        <p aria-live="polite">Loading staff…</p>
      ) : (
        <ul className={styles.staffList} role="list">
          {staff.map((member) => (
            <li key={member.id} className={styles.staffItem} role="listitem">
              <div className={styles.staffAvatar} aria-hidden="true">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.staffInfo}>
                <span className={styles.staffName}>{member.displayName}</span>
                <span className={styles.staffEmail}>{member.email}</span>
              </div>
              <StatusBadge
                type="custom"
                value={member.role}
                label={member.role.replace('_', ' ')}
                variant="blue"
              />
              <button
                type="button"
                className={`${styles.staffToggle} ${member.isActive ? styles.staffDeactivate : styles.staffActivate}`}
                onClick={() => handleToggleActive(member)}
                aria-label={`${member.isActive ? 'Deactivate' : 'Activate'} ${member.displayName}`}
              >
                {member.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Delivery Zones Section ───────────────────────────────────────────────────

function DeliveryZonesSection() {
  return (
    <section aria-labelledby="zones-title">
      <h2 id="zones-title" className={styles.sectionTitle}>Delivery Zones</h2>
      <div className={styles.mapPlaceholder} role="img" aria-label="Delivery zone map editor — interactive polygon editor for PostGIS zones. Requires map library integration.">
        <svg aria-hidden="true" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.mapIcon}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        <p className={styles.mapPlaceholderText}>Interactive delivery zone editor</p>
        <p className={styles.mapPlaceholderHint}>
          Integrate with Mapbox or Google Maps to draw polygon zones.
          Zones are stored as PostGIS geometries via the Sprint 10 delivery API.
        </p>
      </div>
    </section>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('org');

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings"
        subtitle="Manage your organization configuration."
        breadcrumbs={[{ label: 'Dashboard', to: '/admin' }, { label: 'Settings' }]}
      />

      <div className={styles.layout}>
        {/* ── Section Nav ───────────────────────────────────────── */}
        <nav className={styles.sectionNav} aria-label="Settings sections">
          <ul className={styles.navList} role="list">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  className={`${styles.navBtn} ${activeSection === s.key ? styles.navBtnActive : ''}`}
                  onClick={() => setActiveSection(s.key)}
                  aria-current={activeSection === s.key ? 'page' : undefined}
                >
                  <span aria-hidden="true" className={styles.navIcon}>{s.icon}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Section Content ───────────────────────────────────── */}
        <div className={styles.sectionContent}>
          {activeSection === 'org'      && <OrgProfileSection />}
          {activeSection === 'branding' && <BrandingSection />}
          {activeSection === 'zones'    && <DeliveryZonesSection />}
          {activeSection === 'tax'      && <TaxConfigSection />}
          {activeSection === 'staff'    && <StaffSection />}
        </div>
      </div>
    </div>
  );
}

