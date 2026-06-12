import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { BODY_FONTS, DISPLAY_FONTS } from './font-catalog';
import { COLOR_FIELDS, THEME_PRESETS, type ThemeColors, type ThemePreset } from './theme-presets';
import { ThemeService, type ThemeConfig } from './theme.service';

const EMPTY_COLORS: ThemeColors = {
  primary: '#000000',
  secondary: '#000000',
  accent: '#000000',
  bgPrimary: '#ffffff',
  bgSecondary: '#f5f5f5',
  bgCard: '#ffffff',
  textPrimary: '#000000',
  textSecondary: '#666666',
  sidebarBg: '#000000',
  sidebarText: '#ffffff',
  success: '#2a7a40',
  warning: '#d97706',
  error: '#c0392b',
  info: '#2e86ab',
  isDark: false,
};

const DEFAULT_PRESET_ID = 'casual';

/**
 * Maps editor `ThemeColors` keys to the CSS custom-property names used
 * by storefront theme files (`packages/ui/src/themes/theme.<id>.css`).
 * sc-687: shared by the inline preview surface (applies vars to a
 * wrapper element) and the "Download theme.css" exporter.
 */
const CSS_VAR_MAP: Record<keyof Omit<ThemeColors, 'isDark'>, string> = {
  primary: '--color-primary',
  secondary: '--color-primary-light',
  accent: '--color-accent',
  bgPrimary: '--color-bg',
  bgSecondary: '--color-bg-alt',
  bgCard: '--color-surface',
  textPrimary: '--color-text',
  textSecondary: '--color-text-secondary',
  sidebarBg: '--color-sidebar-bg',
  sidebarText: '--color-sidebar-text',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
};

export function buildThemeCss(themeId: string, colors: ThemeColors): string {
  const safeId = (themeId || 'custom').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  const lines: string[] = [
    '/**',
    ' * GreenStack Theme: ' + safeId,
    ' * Exported from the admin theme designer (sc-687).',
    ' * Drop into packages/ui/src/themes/ to ship as a built-in theme.',
    ' */',
    ":root[data-theme='" + safeId + "'] {",
  ];
  for (const [key, varName] of Object.entries(CSS_VAR_MAP) as Array<
    [keyof Omit<ThemeColors, 'isDark'>, string]
  >) {
    const value = (colors as unknown as Record<string, string>)[key];
    lines.push('  ' + varName + ': ' + value + ';');
  }
  lines.push('  color-scheme: ' + (colors.isDark ? 'dark' : 'light') + ';');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

/**
 * Storefront theme designer. Preset gallery + per-field color editor
 * + isDark toggle + Save mutation, plus (sc-687) an inline live
 * preview surface that reflects edits in real time via CSS custom
 * properties and a "Download CSS" exporter that emits a drop-in
 * `theme.<id>.css` file for `packages/ui/src/themes/`.
 *
 * Iframe-based preview was considered and deferred — see sc-687
 * shipped comment. The inline surface satisfies the 100ms acceptance
 * criterion without adding cross-origin routing or a preview-only
 * storefront route.
 *
 * Admin's CLAUDE.md prohibits per-tenant theme injection *inside*
 * the admin app itself; this page configures the **storefront's**
 * theme, not the admin's, so no conflict.
 */
@Component({
  selector: 'cs-theme-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <a
        routerLink="/settings"
        class="text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
      >
        ← Back to settings
      </a>

      <header class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-(--color-text)">Storefront theme</h1>
          <p class="mt-1 text-sm text-(--color-text-muted)">
            Customize colors for the customer-facing storefront. Pick a preset or hand-tune the 14
            color tokens below.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            (click)="onExportCss()"
            class="rounded-lg border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-secondary) hover:text-(--color-text)"
            aria-label="Download theme CSS"
          >
            Download CSS
          </button>
          <button
            type="button"
            (click)="onResetToActivePreset()"
            [disabled]="!isDirty()"
            class="rounded-lg border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-text-secondary) hover:text-(--color-text) disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="!isDirty() || saving()"
            class="rounded-lg bg-(--color-primary) px-4 py-2 text-xs font-bold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
          >
            @if (savedTick()) {
              ✓ Saved
            } @else if (saving()) {
              Saving…
            } @else {
              Save theme
            }
          </button>
        </div>
      </header>

      @if (themableDispensaries().length > 1) {
        <div
          class="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
          aria-label="Dispensary picker"
        >
          <label class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
            Site
          </label>
          <select
            (change)="onSelectDispensary($event)"
            aria-label="Choose dispensary to theme"
            class="rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
          >
            @for (d of themableDispensaries(); track d.entityId) {
              <option
                [value]="d.entityId"
                [selected]="d.entityId === activeDispensaryId()"
              >
                {{ d.name }} ({{ d.slug }})
              </option>
            }
          </select>
          <span class="text-xs text-(--color-text-muted)">
            You have access to {{ themableDispensaries().length }} sites.
          </span>
        </div>
      }

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading theme…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load theme</h2>
          <p class="mt-1 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Preset gallery -->
          <div
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 lg:col-span-1"
          >
            <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
              Design presets
            </h2>
            <ul class="space-y-2">
              @for (p of presets; track p.id) {
                <li>
                  <button
                    type="button"
                    (click)="onApplyPreset(p)"
                    class="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all"
                    [class]="
                      activePreset() === p.id
                        ? 'bg-(--color-bg) ring-1 ring-(--color-primary)'
                        : 'hover:bg-(--color-surface-hover)'
                    "
                    [attr.aria-pressed]="activePreset() === p.id"
                    [attr.aria-label]="'Apply preset ' + p.label"
                  >
                    <span class="flex shrink-0 gap-0.5" aria-hidden="true">
                      @for (sw of p.swatches; track $index) {
                        <span
                          class="block h-4 w-4 rounded-full border border-(--color-border)"
                          [style.background-color]="sw"
                        ></span>
                      }
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-medium text-(--color-text)">
                        {{ p.label }}
                      </span>
                      <span class="block truncate text-xs text-(--color-text-muted)">
                        {{ p.description }}
                      </span>
                    </span>
                  </button>
                </li>
              }
            </ul>
          </div>

          <!-- Color editor -->
          <div
            class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 lg:col-span-2"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
                Colors
              </h2>
              <label
                class="flex cursor-pointer items-center gap-2 text-xs text-(--color-text-secondary)"
              >
                <input
                  type="checkbox"
                  [checked]="local().isDark"
                  (change)="onIsDarkChange($event)"
                  aria-label="Dark theme"
                  class="h-4 w-4 accent-(--color-primary)"
                />
                Dark theme
              </label>
            </div>

            @for (group of colorGroups; track group.id) {
              <fieldset class="space-y-2">
                <legend
                  class="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)"
                >
                  {{ group.label }}
                </legend>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  @for (field of group.fields; track field.key) {
                    <label class="flex items-center gap-3">
                      <input
                        type="color"
                        [value]="colorValue(field.key)"
                        (input)="onColorInput(field.key, $event)"
                        [attr.aria-label]="field.label + ' color'"
                        class="h-9 w-9 cursor-pointer rounded border border-(--color-border)"
                      />
                      <div class="min-w-0 flex-1">
                        <p class="text-[10px] font-semibold text-(--color-text-secondary)">
                          {{ field.label }}
                        </p>
                        <input
                          type="text"
                          [value]="colorValue(field.key)"
                          (input)="onHexInput(field.key, $event)"
                          [attr.aria-label]="field.label + ' hex value'"
                          class="w-full bg-transparent font-mono text-xs text-(--color-text) focus:outline-none"
                        />
                      </div>
                    </label>
                  }
                </div>
              </fieldset>
            }

            @if (savedTick()) {
              <p class="text-xs text-emerald-500" role="status">Theme saved successfully.</p>
            }
          </div>
        </div>

        <!-- Fonts + branding (sc-637 follow-on) -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            class="space-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
            aria-label="Fonts"
          >
            <h2 class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
              Fonts
            </h2>
            <p class="text-xs text-(--color-text-muted)">
              Drawn from a curated Google Fonts list. The CSS endpoint adds the
              <code>@import</code> automatically — no extra setup.
            </p>
            <label class="block text-xs">
              <span class="mb-1 block font-semibold text-(--color-text-secondary)">
                Display font (headings)
              </span>
              <select
                (change)="onDisplayFontChange($event)"
                aria-label="Display font"
                class="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
              >
                <option value="" [selected]="!displayFont()">— Use preset default —</option>
                @for (f of displayFonts; track f.family) {
                  <option [value]="f.family" [selected]="f.family === displayFont()">
                    {{ f.family }}
                  </option>
                }
              </select>
            </label>
            <label class="block text-xs">
              <span class="mb-1 block font-semibold text-(--color-text-secondary)">
                Body font
              </span>
              <select
                (change)="onBodyFontChange($event)"
                aria-label="Body font"
                class="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
              >
                <option value="" [selected]="!bodyFont()">— Use preset default —</option>
                @for (f of bodyFonts; track f.family) {
                  <option [value]="f.family" [selected]="f.family === bodyFont()">
                    {{ f.family }}
                  </option>
                }
              </select>
            </label>
          </section>

          <section
            class="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
            aria-label="Branding assets"
          >
            <h2 class="text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
              Branding
            </h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p class="mb-2 text-xs font-semibold text-(--color-text-secondary)">
                  Logo <span class="text-(--color-text-muted)">(2 MB max)</span>
                </p>
                <div
                  class="flex h-24 items-center justify-center rounded-md border border-dashed border-(--color-border) bg-(--color-bg)"
                >
                  @if (config()?.logoUrl; as src) {
                    <img
                      [src]="src"
                      alt="Current dispensary logo"
                      class="max-h-20 max-w-full object-contain"
                    />
                  } @else {
                    <span class="text-xs text-(--color-text-muted)">No logo uploaded</span>
                  }
                </div>
                <label class="mt-2 block text-xs">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    (change)="onLogoSelected($event)"
                    [disabled]="uploading() === 'logo'"
                    aria-label="Upload dispensary logo"
                    class="block w-full text-xs text-(--color-text-secondary)"
                  />
                </label>
                @if (uploading() === 'logo') {
                  <p class="mt-1 text-xs text-(--color-text-muted)" role="status">Uploading…</p>
                }
              </div>
              <div>
                <p class="mb-2 text-xs font-semibold text-(--color-text-secondary)">
                  Masthead <span class="text-(--color-text-muted)">(5 MB max)</span>
                </p>
                <div
                  class="flex h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-(--color-border) bg-(--color-bg)"
                >
                  @if (config()?.mastheadUrl; as src) {
                    <img
                      [src]="src"
                      alt="Current storefront masthead"
                      class="h-full w-full object-cover"
                    />
                  } @else {
                    <span class="text-xs text-(--color-text-muted)">No masthead uploaded</span>
                  }
                </div>
                <label class="mt-2 block text-xs">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    (change)="onMastheadSelected($event)"
                    [disabled]="uploading() === 'masthead'"
                    aria-label="Upload storefront masthead"
                    class="block w-full text-xs text-(--color-text-secondary)"
                  />
                </label>
                @if (uploading() === 'masthead') {
                  <p class="mt-1 text-xs text-(--color-text-muted)" role="status">Uploading…</p>
                }
              </div>
            </div>
          </section>
        </div>

        <!-- Live preview surface (sc-687). Picks up the in-flight color
             edits via CSS custom properties scoped to the wrapper, so
             every keystroke re-paints without a fetch or reload. -->
        <div
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
          aria-label="Live storefront preview"
        >
          <h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-(--color-text-muted)">
            Live preview
          </h2>
          <div
            data-testid="theme-preview-surface"
            [attr.style]="previewVarsStyle()"
            class="overflow-hidden rounded-xl border"
            style="
              border-color: var(--cs-preview-border, #e5e5e5);
              background: var(--color-bg);
              color: var(--color-text);
            "
          >
            <header
              class="flex items-center justify-between px-4 py-3"
              style="background: var(--color-sidebar-bg); color: var(--color-sidebar-text);"
            >
              <span class="text-sm font-bold">Acme Dispensary</span>
              <button
                type="button"
                tabindex="-1"
                class="rounded-full px-3 py-1 text-xs font-bold"
                style="background: var(--color-accent); color: #fff;"
              >
                Cart (2)
              </button>
            </header>
            <div class="px-4 py-6 text-sm" style="background: var(--color-bg-alt);">
              <p
                class="text-xs uppercase tracking-wider"
                style="color: var(--color-text-secondary);"
              >
                Featured
              </p>
              <h3 class="mt-1 text-lg font-bold" style="color: var(--color-text);">
                Fresh drop · Indoor flower
              </h3>
              <p class="mt-1 text-xs" style="color: var(--color-text-secondary);">
                Sample storefront surface — colors mirror the edit set above.
              </p>
            </div>
            <div class="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
              <div
                class="rounded-lg p-3"
                style="background: var(--color-surface); color: var(--color-text);"
              >
                <p class="text-sm font-semibold">Northern Lights · 3.5g</p>
                <p class="text-xs" style="color: var(--color-text-secondary);">Indica · 24% THC</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-base font-bold" style="color: var(--color-primary);">$45</span>
                  <button
                    type="button"
                    tabindex="-1"
                    class="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style="background: var(--color-primary);"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div
                class="rounded-lg p-3"
                style="background: var(--color-surface); color: var(--color-text);"
              >
                <p class="text-sm font-semibold">Sour Diesel · 1g pre-roll</p>
                <p class="text-xs" style="color: var(--color-text-secondary);">Sativa · 22% THC</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-base font-bold" style="color: var(--color-primary);">$12</span>
                  <button
                    type="button"
                    tabindex="-1"
                    class="rounded-full px-3 py-1 text-xs font-bold text-white"
                    style="background: var(--color-primary);"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-4 py-3 text-xs"
              style="background: var(--color-bg); color: var(--color-text-secondary);"
            >
              <span>Status: <span style="color: var(--color-success);">Open</span></span>
              <span>Closes 9pm</span>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class ThemePage {
  private readonly svc = inject(ThemeService);
  private readonly auth = inject(AuthService);

  protected readonly presets = THEME_PRESETS;
  protected readonly displayFonts = DISPLAY_FONTS;
  protected readonly bodyFonts = BODY_FONTS;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;
  protected readonly uploading = this.svc.uploading;
  protected readonly config = this.svc.config;
  protected readonly themableDispensaries = this.svc.themableDispensaries;
  protected readonly activeDispensaryId = this.svc.activeDispensaryId;

  /** Local edit state — diverges from `svc.config()` until Save/Reset. */
  protected readonly local = signal<ThemeColors>(EMPTY_COLORS);
  protected readonly activePreset = signal<string>(DEFAULT_PRESET_ID);
  protected readonly savedTick = signal<boolean>(false);

  /** Font selection lives outside ThemeColors so the preview surface
   * (which renders against ThemeColors only) doesn't need to know. */
  protected readonly displayFont = signal<string | null>(null);
  protected readonly bodyFont = signal<string | null>(null);

  protected readonly colorGroups = [
    { id: 'brand', label: 'Brand', fields: COLOR_FIELDS.filter((f) => f.group === 'brand') },
    {
      id: 'surface',
      label: 'Surface',
      fields: COLOR_FIELDS.filter((f) => f.group === 'surface'),
    },
    {
      id: 'semantic',
      label: 'Semantic',
      fields: COLOR_FIELDS.filter((f) => f.group === 'semantic'),
    },
  ] as const;

  protected readonly errorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load theme.';
  });

  /**
   * Inline `style` attribute for the preview wrapper. We can't bind to
   * arbitrary CSS-var names via [style.--x] without DomSanitizer fuss,
   * so we build the declarations once per signal change and let the
   * browser parse them on assignment.
   */
  protected readonly previewVarsStyle = computed<string>(() => {
    const c = this.local();
    const parts: string[] = [];
    for (const [key, varName] of Object.entries(CSS_VAR_MAP) as Array<
      [keyof Omit<ThemeColors, 'isDark'>, string]
    >) {
      parts.push(varName + ':' + (c as unknown as Record<string, string>)[key]);
    }
    return parts.join(';');
  });

  protected readonly isDirty = computed(() => {
    const server = this.svc.config();
    const localState = this.local();
    if (!server) return false;
    for (const field of COLOR_FIELDS) {
      if (
        (server as unknown as Record<string, string>)[field.key] !==
        (localState as unknown as Record<string, string>)[field.key]
      ) {
        return true;
      }
    }
    if (server.isDark !== localState.isDark) return true;
    if (server.preset !== this.activePreset()) return true;
    if ((server.displayFont ?? null) !== this.displayFont()) return true;
    if ((server.bodyFont ?? null) !== this.bodyFont()) return true;
    return false;
  });

  constructor() {
    effect(() => {
      const server = this.svc.config();
      if (!server) return;
      this.local.set(themeColorsFromConfig(server));
      this.activePreset.set(server.preset || DEFAULT_PRESET_ID);
      this.displayFont.set(server.displayFont ?? null);
      this.bodyFont.set(server.bodyFont ?? null);
    });
  }

  protected onSelectDispensary(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id) this.svc.setActiveDispensary(id);
  }

  protected onDisplayFontChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.displayFont.set(value || null);
  }

  protected onBodyFontChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.bodyFont.set(value || null);
  }

  protected async onLogoSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.svc.uploadLogo(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected async onMastheadSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) await this.svc.uploadMasthead(file);
    (event.target as HTMLInputElement).value = '';
  }

  protected colorValue(key: keyof ThemeColors): string {
    const v = (this.local() as unknown as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : '#000000';
  }

  protected onColorInput(key: keyof ThemeColors, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateColor(key, value);
  }

  protected onHexInput(key: keyof ThemeColors, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      this.updateColor(key, value);
    }
  }

  protected onIsDarkChange(event: Event): void {
    const isDark = (event.target as HTMLInputElement).checked;
    this.local.update((prev) => ({ ...prev, isDark }));
    this.activePreset.set('custom');
  }

  protected onApplyPreset(p: ThemePreset): void {
    this.local.set({
      primary: p.primary,
      secondary: p.secondary,
      accent: p.accent,
      bgPrimary: p.bgPrimary,
      bgSecondary: p.bgSecondary,
      bgCard: p.bgCard,
      textPrimary: p.textPrimary,
      textSecondary: p.textSecondary,
      sidebarBg: p.sidebarBg,
      sidebarText: p.sidebarText,
      success: p.success,
      warning: p.warning,
      error: p.error,
      info: p.info,
      isDark: p.isDark,
    });
    this.activePreset.set(p.id);
  }

  protected onResetToActivePreset(): void {
    const server = this.svc.config();
    if (server) {
      this.local.set(themeColorsFromConfig(server));
      this.activePreset.set(server.preset || DEFAULT_PRESET_ID);
      this.displayFont.set(server.displayFont ?? null);
      this.bodyFont.set(server.bodyFont ?? null);
    }
  }

  protected onExportCss(): void {
    const css = buildThemeCss(this.activePreset(), this.local());
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.' + (this.activePreset() || 'custom') + '.css';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  protected async onSave(): Promise<void> {
    const dispensaryId = this.svc.activeDispensaryId();
    if (!dispensaryId) return;
    const colors = this.local();
    await this.svc.save({
      dispensaryId,
      preset: this.activePreset(),
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
      displayFont: this.displayFont() ?? undefined,
      bodyFont: this.bodyFont() ?? undefined,
    });
    this.savedTick.set(true);
    setTimeout(() => this.savedTick.set(false), 3000);
  }

  private updateColor(key: keyof ThemeColors, value: string): void {
    this.local.update((prev) => ({ ...prev, [key]: value }) as ThemeColors);
    this.activePreset.set('custom');
  }
}

function themeColorsFromConfig(cfg: ThemeConfig): ThemeColors {
  return {
    primary: cfg.primary,
    secondary: cfg.secondary,
    accent: cfg.accent,
    bgPrimary: cfg.bgPrimary,
    bgSecondary: cfg.bgSecondary,
    bgCard: cfg.bgCard,
    textPrimary: cfg.textPrimary,
    textSecondary: cfg.textSecondary,
    sidebarBg: cfg.sidebarBg,
    sidebarText: cfg.sidebarText,
    success: cfg.success,
    warning: cfg.warning,
    error: cfg.error,
    info: cfg.info,
    isDark: cfg.isDark,
  };
}
