import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type ThemeName =
  | 'apothecary'
  | 'casual'
  | 'citrus'
  | 'dark'
  | 'earthy'
  | 'midnight'
  | 'minimal'
  | 'modern'
  | 'neon'
  | 'regal';

export const THEME_NAMES: readonly ThemeName[] = [
  'apothecary',
  'casual',
  'citrus',
  'dark',
  'earthy',
  'midnight',
  'minimal',
  'modern',
  'neon',
  'regal',
] as const;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _current = signal<ThemeName>('casual');
  readonly current = this._current.asReadonly();

  /**
   * Static pattern (admin / staff / kiosk):
   * theme CSS is bundled via static import in main.ts.
   * This just toggles the data-theme attribute.
   */
  setTheme(name: ThemeName): void {
    this.document.documentElement.setAttribute('data-theme', name);
    this._current.set(name);
  }

  /**
   * Dynamic pattern (storefront):
   * link-injects the theme CSS at runtime, mirroring ThemeProvider.tsx.
   * Idempotent — safe to call repeatedly with the same name.
   */
  async loadTheme(name: ThemeName, baseUrl = '/themes'): Promise<void> {
    const linkId = `cs-theme-${name}`;
    const existing = this.document.getElementById(linkId);

    if (existing) {
      this.applyTheme(name);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const link = this.document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `${baseUrl}/theme.${name}.css`;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load theme: ${name}`));
      this.document.head.appendChild(link);
    });

    this.applyTheme(name);
  }

  private applyTheme(name: ThemeName): void {
    this.document.documentElement.setAttribute('data-theme', name);
    this._current.set(name);
  }

  /**
   * Per-dispensary CSS pattern (sc-637 follow-on):
   * link-injects the dynamically-generated CSS served by
   * `GET /css/dispensary/:id.css`. The endpoint emits one CSS file
   * containing the dispensary's color palette + Google Fonts
   * `@import` line + brand image URLs.
   *
   * Idempotent: a second call with the same `dispensaryId` replaces
   * the existing link's href so the browser revalidates against the
   * ETag rather than appending a duplicate stylesheet. Apps that
   * support tenant switching (super_admin impersonation) can call
   * this again on the new id.
   *
   * Passing `null` removes the per-dispensary link (used when a
   * super_admin clears their selected dispensary).
   */
  setDispensaryCss(
    apiBaseUrl: string,
    dispensaryId: string | null,
  ): void {
    const linkId = 'cs-dispensary-css';
    const existing = this.document.getElementById(linkId);
    if (!dispensaryId) {
      existing?.remove();
      return;
    }
    const href = `${apiBaseUrl}/css/dispensary/${dispensaryId}.css`;
    if (existing && (existing as HTMLLinkElement).href.endsWith(href)) return;
    if (existing) {
      (existing as HTMLLinkElement).href = href;
      return;
    }
    const link = this.document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = href;
    this.document.head.appendChild(link);
  }
}
