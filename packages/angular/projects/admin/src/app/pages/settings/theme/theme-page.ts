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
 * Storefront theme designer. Mirrors the React `ThemePage` data
 * surface — preset gallery + per-field color editor + isDark toggle
 * + Save mutation. The live-preview iframe and CSS export from the
 * React UX are deferred (the storefront's preview URL routing is
 * dispensary-specific and the export pre-dates the unified token
 * system).
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
      }
    </section>
  `,
})
export class ThemePage {
  private readonly svc = inject(ThemeService);
  private readonly auth = inject(AuthService);

  protected readonly presets = THEME_PRESETS;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly saving = this.svc.saving;

  /** Local edit state — diverges from `svc.config()` until Save/Reset. */
  protected readonly local = signal<ThemeColors>(EMPTY_COLORS);
  protected readonly activePreset = signal<string>(DEFAULT_PRESET_ID);
  protected readonly savedTick = signal<boolean>(false);

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
    return server.isDark !== localState.isDark || server.preset !== this.activePreset();
  });

  constructor() {
    effect(() => {
      const server = this.svc.config();
      if (!server) return;
      this.local.set(themeColorsFromConfig(server));
      this.activePreset.set(server.preset || DEFAULT_PRESET_ID);
    });
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
    }
  }

  protected async onSave(): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
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
