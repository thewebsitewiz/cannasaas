/**
 * @file ThemePage.tsx
 * @app admin
 *
 * Settings page for selecting the dispensary storefront theme.
 * Lives at: /settings/theme
 *
 * Flow:
 *   User clicks theme → live preview via data-theme attr swap
 *   User clicks "Apply Theme" → PATCH /organizations/:id/theme
 *   All apps pick up new theme on next load via organizationStore
 */
import { useState, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, type ThemeId } from '@cannasaas/ui/src/themes/index';
import { applyTheme } from '@cannasaas/ui/src/ThemeLoader';

// ── API call ─────────────────────────────────────────────────────────────────
async function patchTheme(organizationId: string, themeId: string): Promise<void> {
  const res = await fetch(`/api/v1/organizations/${organizationId}/theme`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ themeId }),
  });
  if (!res.ok) throw new Error(`Failed to save theme: ${res.statusText}`);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ThemePage() {
  // Read current theme from store / localStorage fallback
  const currentThemeId: ThemeId =
    (typeof window !== 'undefined'
      ? localStorage.getItem('gs-theme-preview')
      : null) ?? DEFAULT_THEME;

  const [selected, setSelected]   = useState<ThemeId>(currentThemeId);
  const [previewing, setPreviewing] = useState<ThemeId | null>(null);
  const [saving, setSaving]        = useState(false);
  const [saved, setSaved]          = useState(false);
  const [error, setError]          = useState<string | null>(null);

  const isDirty = selected !== currentThemeId;

  // Live hover preview
  const onEnter = useCallback((id: ThemeId) => {
    setPreviewing(id);
    applyTheme(id);
  }, []);

  const onLeave = useCallback(() => {
    setPreviewing(null);
    applyTheme(selected); // revert to confirmed selection
  }, [selected]);

  const onSelect = useCallback((id: ThemeId) => {
    setSelected(id);
    applyTheme(id);
    localStorage.setItem('gs-theme-preview', id);
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Get org ID from meta tag injected by the app shell
      const orgId =
        document.querySelector<HTMLMetaElement>('meta[name="organization-id"]')
          ?.content ?? 'unknown';
      await patchTheme(orgId, selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [selected]);

  return (
    <div className="gs-stack--8" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--sp-8)' }}>

      {/* Page header */}
      <div>
        <p className="gs-eyebrow">Branding</p>
        <h1 className="gs-headline" style={{ marginTop: 8 }}>Storefront Theme</h1>
        <p className="gs-body gs-text-muted" style={{ marginTop: 8 }}>
          Choose the visual style for your customer storefront, staff portal, and kiosk.
          Hover to preview, click to select, then apply.
        </p>
      </div>

      {/* Live preview indicator */}
      {previewing && (
        <div className="gs-alert gs-alert--info">
          <span>Previewing: <strong>{THEMES.find(t => t.id === previewing)?.label}</strong> — move away to revert</span>
        </div>
      )}

      {/* Theme grid */}
      <div className="gs-grid gs-grid--3" style={{ gap: 16 }}>
        {THEMES.map((theme) => {
          const isSelected = selected === theme.id;
          const isCurrent  = currentThemeId === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id as ThemeId)}
              onMouseEnter={() => onEnter(theme.id as ThemeId)}
              onMouseLeave={onLeave}
              aria-pressed={isSelected}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: 20,
                borderRadius: 18,
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-xlight)' : 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'all 160ms ease',
                boxShadow: isSelected ? 'var(--ring-green)' : 'var(--shadow-sm)',
              }}
            >
              {/* Swatches */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {theme.swatches.map((color, i) => (
                  <span key={i} style={{
                    width: i === 0 ? 36 : 24,
                    height: i === 0 ? 36 : 24,
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid rgba(0,0,0,.1)',
                    flexShrink: 0,
                  }} />
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {theme.dark && (
                    <span className="gs-badge gs-badge--gray">Dark</span>
                  )}
                  {isCurrent && (
                    <span className="gs-badge gs-badge--green">Active</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{theme.label}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                  {theme.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="gs-alert gs-alert--error">{error}</div>
      )}

      {/* Action bar */}
      <div className="gs-flex-between" style={{
        paddingTop: 20,
        borderTop: '1px solid var(--color-border)',
      }}>
        <span className="gs-body-sm gs-text-muted">
          {isDirty
            ? `Unsaved — switching to "${THEMES.find(t => t.id === selected)?.label}"`
            : 'No unsaved changes'}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          {isDirty && (
            <button
              type="button"
              className="gs-btn gs-btn--ghost"
              onClick={() => { setSelected(currentThemeId); applyTheme(currentThemeId); }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className={`gs-btn gs-btn--primary${saving ? ' gs-btn--loading' : ''}`}
            onClick={onSave}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving…' : saved ? '✓ Theme Applied' : 'Apply Theme'}
          </button>
        </div>
      </div>

    </div>
  );
}
