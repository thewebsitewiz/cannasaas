import { useState, useCallback, useEffect } from 'react';
import {
  THEME_PRESETS,
  setThemePreset,
  clearInlineThemeVars,
  injectThemeVars,
} from '@cannasaas/ui';
import { useThemeStore, type ThemeColors } from '@cannasaas/stores';
import { useOrganizationStore } from '@cannasaas/stores';
import { gqlRequest } from '../../lib/graphql-client';
import { Palette, Check, RotateCcw, Download, Eye } from 'lucide-react';

// ─── Color field definitions ───
const COLOR_FIELDS: { key: keyof ThemeColors; label: string; group: string }[] =
  [
    { key: 'primary', label: 'Primary', group: 'brand' },
    { key: 'secondary', label: 'Secondary', group: 'brand' },
    { key: 'accent', label: 'Accent', group: 'brand' },
    { key: 'bgPrimary', label: 'Background', group: 'surface' },
    { key: 'bgSecondary', label: 'Bg Secondary', group: 'surface' },
    { key: 'bgCard', label: 'Card', group: 'surface' },
    { key: 'textPrimary', label: 'Text Primary', group: 'surface' },
    { key: 'textSecondary', label: 'Text Secondary', group: 'surface' },
    { key: 'sidebarBg', label: 'Sidebar Bg', group: 'surface' },
    { key: 'sidebarText', label: 'Sidebar Text', group: 'surface' },
    { key: 'success', label: 'Success', group: 'semantic' },
    { key: 'warning', label: 'Warning', group: 'semantic' },
    { key: 'error', label: 'Error / Alert', group: 'semantic' },
    { key: 'info', label: 'Info', group: 'semantic' },
  ];

// ─── GraphQL ───
const SAVE_MUTATION = `
  mutation SaveThemeConfig($input: SaveThemeConfigInput!) {
    saveThemeConfig(input: $input) {
      id preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary sidebarBg sidebarText
      success warning error info isDark
    }
  }
`;

const THEME_QUERY = `
  query ThemeConfig($dispensaryId: String!) {
    themeConfig(dispensaryId: $dispensaryId) {
      preset primary secondary accent
      bgPrimary bgSecondary bgCard
      textPrimary textSecondary sidebarBg sidebarText
      success warning error info isDark
    }
  }
`;

// ─── Color Input Component ───
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-7 h-7 rounded-md overflow-hidden border border-bdr shrink-0 cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-[-4px] w-9 h-9 border-none cursor-pointer"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-txt-secondary">
          {label}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
              onChange(e.target.value);
          }}
          className="text-[10px] font-mono text-txt-secondary bg-transparent border-none outline-none p-0 w-full"
        />
      </div>
    </div>
  );
}

// ─── Main ThemePage ───
export default function ThemePage() {
  const dispensaryId = useOrganizationStore((s) => s.dispensaryId);
  const {
    colors,
    activePreset,
    dirty,
    setPreset,
    setColor,
    setColors,
    markClean,
  } = useThemeStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);

  // ─── Fetch existing config on mount ───
  useEffect(() => {
    if (!dispensaryId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data = await gqlRequest<{
          themeConfig: ThemeColors & { preset: string };
        }>(THEME_QUERY, { dispensaryId });
        if (data?.themeConfig) {
          const cfg = data.themeConfig;
          setColors(cfg as ThemeColors);
          // Apply the saved preset via data-theme attribute
          if (cfg.preset && cfg.preset !== 'custom') {
            clearInlineThemeVars();
            setThemePreset(cfg.preset);
          }
        }
      } catch (err) {
        console.warn('[ThemePage] Could not load theme config:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dispensaryId, setColors]);

  // ─── Live preview: switch theme via data-theme for presets,
  //     or inject inline vars for custom color editing ───
  useEffect(() => {
    if (activePreset !== 'custom') {
      clearInlineThemeVars();
      setThemePreset(activePreset);
    } else {
      injectThemeVars(colors);
    }
  }, [colors, activePreset]);

  // Clean up inline overrides when leaving the page
  useEffect(() => {
    return () => {
      clearInlineThemeVars();
    };
  }, []);

  // ─── Save to backend ───
  const handleSave = useCallback(async () => {
    if (!dispensaryId) {
      alert('No dispensary selected. Theme saved locally only.');
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaving(true);
    try {
      const input = {
        dispensaryId,
        preset: activePreset,
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        bgPrimary: colors.bgPrimary,
        bgSecondary: colors.bgSecondary,
        bgCard: colors.bgCard,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        sidebarBg: colors.sidebarBg,
        sidebarText: colors.sidebarText,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        isDark: colors.isDark,
      };
      await gqlRequest(SAVE_MUTATION, { input });

      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[ThemePage] Save failed:', err);
      alert('Failed to save theme. Check console for details.');
    } finally {
      setSaving(false);
    }
  }, [dispensaryId, activePreset, colors, markClean]);

  // ─── Export helpers ───
  const generateCSS = () => {
    const c = colors;
    return `/* GreenStack Theme: ${activePreset} */
:root {
  --color-primary: ${c.primary};
  --color-primary-hover: ${c.secondary};
  --color-accent: ${c.accent};
  --color-bg: ${c.bgPrimary};
  --color-bg-alt: ${c.bgSecondary};
  --color-surface: ${c.bgCard};
  --color-text: ${c.textPrimary};
  --color-text-secondary: ${c.textSecondary};
  --gs-deep-pine: ${c.sidebarBg};
  --gs-pine: ${c.sidebarBg};
  --color-success: ${c.success};
  --color-warning: ${c.warning};
  --color-danger: ${c.error};
  --color-info: ${c.info};
}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-txt-muted text-sm">
        Loading theme...
      </div>
    );
  }

  const brandFields = COLOR_FIELDS.filter((f) => f.group === 'brand');
  const surfaceFields = COLOR_FIELDS.filter((f) => f.group === 'surface');
  const semanticFields = COLOR_FIELDS.filter((f) => f.group === 'semantic');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-txt flex items-center gap-2">
            <Palette size={24} />
            Theme Designer
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Customize colors for all portals — storefront, admin, staff & kiosk
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-bdr rounded-lg hover:bg-bg-alt"
          >
            <Download size={14} />
            {showExport ? 'Back' : 'Export CSS'}
          </button>
          <button
            onClick={() => {
              setPreset(
                'casual',
                THEME_PRESETS['casual'] as unknown as ThemeColors,
              );
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-bdr rounded-lg hover:bg-bg-alt"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              saved
                ? 'bg-success text-txt-inverse'
                : 'bg-brand-500 text-txt-inverse hover:bg-brand-600'
            }`}
          >
            {saved ? <Check size={14} /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Theme'}
          </button>
        </div>
      </div>

      {showExport ? (
        <div className="bg-surface rounded-xl border border-bdr p-6">
          <h2 className="font-semibold text-txt mb-3">CSS Custom Properties</h2>
          <pre className="bg-gs-deep-pine text-txt-muted p-4 rounded-lg text-xs font-mono overflow-auto leading-relaxed">
            {generateCSS()}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Presets + Colors */}
          <div className="col-span-4 space-y-4">
            {/* Presets */}
            <div className="bg-surface rounded-xl border border-bdr p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-txt-muted mb-3">
                Design Presets
              </h2>
              <div className="space-y-1.5">
                {Object.values(THEME_PRESETS).map((p) => {
                  const isActive = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        setPreset(p.id, p as unknown as ThemeColors)
                      }
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-surface-alt ring-1 ring-bdr-strong'
                          : 'hover:bg-bg-alt'
                      }`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {p.swatches.map((c: string, i: number) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded"
                            style={{
                              background: c,
                              border: '1px solid rgba(0,0,0,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-txt">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-txt-secondary leading-tight">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-surface rounded-xl border border-bdr p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-txt-muted mb-3">
                Brand Colors
              </h2>
              <div className="space-y-3">
                {brandFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
            </div>

            {/* Surface Colors */}
            <div className="bg-surface rounded-xl border border-bdr p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-txt-muted mb-3">
                Surfaces & Type
              </h2>
              <div className="space-y-3">
                {surfaceFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="bg-surface rounded-xl border border-bdr p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-txt-muted mb-3">
                Semantic / Functional
              </h2>
              <div className="space-y-3">
                {semanticFields.map((f) => (
                  <ColorInput
                    key={f.key}
                    label={f.label}
                    value={colors[f.key] as string}
                    onChange={(v) => setColor(f.key, v)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {semanticFields.map((f) => (
                  <span
                    key={f.key}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${colors[f.key] as string}1a`,
                      color: colors[f.key] as string,
                    }}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Live Preview */}
          <div className="col-span-8">
            <div className="bg-surface rounded-xl border border-bdr p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-txt-muted" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-txt-muted">
                  Live Preview
                </h2>
                {dirty && (
                  <span className="text-[10px] px-2 py-0.5 bg-warning-bg text-warning rounded-full font-medium">
                    Unsaved changes
                  </span>
                )}
              </div>

              {/* Admin Preview */}
              <div className="rounded-lg overflow-hidden border border-bdr mb-4">
                <div className="bg-surface-alt px-3 py-1.5 border-b border-bdr flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-txt-muted">
                    admin.greenleaf.com
                  </span>
                </div>
                <div className="flex" style={{ minHeight: 240 }}>
                  <aside
                    className="w-32 p-2 flex flex-col gap-0.5 shrink-0"
                    style={{
                      background: colors.sidebarBg,
                      color: colors.sidebarText,
                    }}
                  >
                    <div
                      className="text-[10px] font-bold px-2 py-1 mb-1"
                      style={{ color: colors.primary }}
                    >
                      Admin Portal
                    </div>
                    {[
                      'Dashboard',
                      'Products',
                      'Orders',
                      'Inventory',
                      'Settings',
                    ].map((item, i) => (
                      <div
                        key={item}
                        className="text-[9px] px-2 py-1 rounded"
                        style={{
                          background:
                            i === 0 ? `${colors.sidebarText}15` : 'transparent',
                          color: i === 0 ? '#fff' : colors.sidebarText,
                          fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </aside>
                  <main
                    className="flex-1 p-3"
                    style={{
                      background: colors.bgPrimary,
                      color: colors.textPrimary,
                    }}
                  >
                    <div className="text-sm font-bold mb-3">Dashboard</div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: 'Revenue', val: '$12,450', c: colors.primary },
                        { label: 'Orders', val: '187', c: colors.textPrimary },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-md p-2"
                          style={{
                            background: colors.bgCard,
                            border: `1px solid ${colors.textSecondary}14`,
                          }}
                        >
                          <div
                            className="text-[8px]"
                            style={{ color: colors.textSecondary }}
                          >
                            {s.label}
                          </div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: s.c }}
                          >
                            {s.val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{
                          background: `${colors.warning}1a`,
                          color: colors.warning,
                        }}
                      >
                        ⚠ Low stock: Purple Haze
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{
                          background: `${colors.success}1a`,
                          color: colors.success,
                        }}
                      >
                        ✓ Metrc sync complete
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{
                          background: `${colors.error}1a`,
                          color: colors.error,
                        }}
                      >
                        ✕ License expiring soon
                      </div>
                      <div
                        className="text-[8px] px-2 py-1 rounded"
                        style={{
                          background: `${colors.info}1a`,
                          color: colors.info,
                        }}
                      >
                        ℹ 3 new orders pending
                      </div>
                    </div>
                  </main>
                </div>
              </div>

              {/* Storefront Preview */}
              <div className="rounded-lg overflow-hidden border border-bdr">
                <div className="bg-surface-alt px-3 py-1.5 border-b border-bdr flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-txt-muted">
                    greenleaf.com
                  </span>
                </div>
                <div
                  style={{
                    background: colors.bgPrimary,
                    color: colors.textPrimary,
                  }}
                >
                  <header
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      background: colors.bgCard,
                      borderBottom: `1px solid ${colors.textSecondary}14`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ background: colors.primary }}
                      />
                      <span className="text-xs font-bold">GreenLeaf</span>
                    </div>
                    <span
                      className="text-[9px] px-2 py-1 rounded font-semibold"
                      style={{ background: colors.primary, color: '#fff' }}
                    >
                      Sign In
                    </span>
                  </header>
                  <div className="p-3">
                    <div className="flex gap-1 mb-3">
                      {['All', 'Flower', 'Edible'].map((c, i) => (
                        <span
                          key={c}
                          className="text-[9px] px-2 py-1 rounded font-semibold"
                          style={{
                            background:
                              i === 0 ? colors.primary : colors.bgCard,
                            color: i === 0 ? '#fff' : colors.textSecondary,
                            border:
                              i === 0
                                ? 'none'
                                : `1px solid ${colors.textSecondary}20`,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Blue Dream', 'OG Kush', 'GSC'].map((name) => (
                        <div
                          key={name}
                          className="rounded-md overflow-hidden"
                          style={{
                            background: colors.bgCard,
                            border: `1px solid ${colors.textSecondary}10`,
                          }}
                        >
                          <div
                            className="aspect-[4/3]"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}0d, ${colors.secondary}08)`,
                            }}
                          />
                          <div className="p-2">
                            <div className="text-[10px] font-bold">{name}</div>
                            <div className="flex justify-between items-center mt-1">
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: colors.primary }}
                              >
                                $35
                              </span>
                              <span
                                className="text-[7px] px-1.5 py-0.5 rounded font-semibold"
                                style={{
                                  background: colors.primary,
                                  color: '#fff',
                                }}
                              >
                                Add
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active palette row */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-txt-muted">
                  Active Palette
                </span>
                <div className="flex gap-1">
                  {[
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    colors.bgPrimary,
                    colors.bgCard,
                    colors.success,
                    colors.warning,
                    colors.error,
                    colors.info,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded border border-bdr"
                      style={{ background: c as string }}
                      title={c as string}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
