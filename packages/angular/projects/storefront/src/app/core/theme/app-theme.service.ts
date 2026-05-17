import { Injectable, inject } from '@angular/core';
import { THEME_NAMES, ThemeConfigGQL, ThemeName, ThemeService } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

const FALLBACK_THEME: ThemeName = 'dark';
const ALLOWED_THEMES: ReadonlySet<ThemeName> = new Set(THEME_NAMES);

/**
 * Storefront-flavored wrapper around `@cannasaas/ui-ng` ThemeService.
 *
 * Dispensary themes are link-injected at runtime so every tenant can ship a
 * different theme without rebuilding. Theme CSS files are served from
 * `environment.themeBaseUrl/theme.<slug>.css` (the storefront build copies
 * them in from `@cannasaas/ui-ng/themes/`).
 *
 * Per-tenant resolution flow:
 * 1. Dispensary entityId arrives via the resolver.
 * 2. `ThemeConfigGQL.fetch({ dispensaryId })` returns `{ preset, isDark }`.
 * 3. The `preset` string is whitelisted against `THEME_NAMES`; unknown
 *    values fall back to the dark theme.
 * 4. `ThemeService.loadTheme(slug, baseUrl)` link-injects the CSS file and
 *    sets `data-theme` on `<html>`.
 *
 * Note: the React storefront also fetched `designSystemConfig(dispensaryId)`
 * to optionally `<link>` in a second CSS bundle (casual.css vs spring-bloom.css).
 * Per the storefront/CLAUDE.md tech-debt note ("adopt one model only"), the
 * Angular replacement keeps only the preset model. Add the second mechanism
 * back if a dispensary actually needs it.
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly theme = inject(ThemeService);
  private readonly themeConfigGQL = inject(ThemeConfigGQL);
  private readonly dispensary = inject(DispensaryContextService);

  readonly currentTheme = this.theme.current;

  async applyForCurrentTenant(): Promise<void> {
    const themeSlug = await this.resolveThemeForDispensary(this.dispensary.entityId());
    const safe = this.normalize(themeSlug);
    await this.theme.loadTheme(safe, environment.themeBaseUrl);
  }

  async setTheme(name: string): Promise<void> {
    await this.theme.loadTheme(this.normalize(name), environment.themeBaseUrl);
  }

  private normalize(candidate: string | null | undefined): ThemeName {
    if (candidate && ALLOWED_THEMES.has(candidate as ThemeName)) {
      return candidate as ThemeName;
    }
    return FALLBACK_THEME;
  }

  private async resolveThemeForDispensary(entityId: string | null): Promise<string | null> {
    if (!entityId) return null;
    try {
      const result = await firstValueFrom(
        this.themeConfigGQL.fetch({ variables: { dispensaryId: entityId } }),
      );
      return result.data?.themeConfig?.preset ?? null;
    } catch (err: unknown) {
      console.warn('[AppThemeService] themeConfig fetch failed; using fallback theme', err);
      return null;
    }
  }
}
