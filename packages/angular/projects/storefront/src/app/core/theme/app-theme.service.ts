import { Injectable, inject } from '@angular/core';
import { THEME_NAMES, ThemeName, ThemeService } from '@cannasaas/ui-ng';
import { environment } from '../../../environments/environment';
import { DispensaryContextService } from '../tenant/dispensary-context.service';

const FALLBACK_THEME: ThemeName = 'dark';
const ALLOWED_THEMES: ReadonlySet<ThemeName> = new Set(THEME_NAMES);

/**
 * Storefront-flavored wrapper around `@cannasaas/ui-ng` ThemeService.
 *
 * Dispensary themes are link-injected at runtime so every tenant can ship a
 * different theme without rebuilding. Theme files are served from
 * `environment.themeBaseUrl/theme.<slug>.css`.
 *
 * TODO(post-scaffold): wire `loadConfigForTenant()` to a `theme_configs`
 * GraphQL query keyed on the resolved dispensary entityId. For now,
 * `applyForCurrentTenant()` falls back to the default theme.
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly theme = inject(ThemeService);
  private readonly dispensary = inject(DispensaryContextService);

  readonly currentTheme = this.theme.current;

  async applyForCurrentTenant(): Promise<void> {
    const themeSlug = this.resolveThemeForDispensary(this.dispensary.entityId());
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

  private resolveThemeForDispensary(entityId: string | null): string | null {
    if (!entityId) return null;
    // TODO: replace with `ThemeConfigByDispensaryGQL.fetch({ dispensaryId: entityId })`
    // once the operation lands in @cannasaas/ui-ng and codegen has run.
    // Becomes async at that point — the caller already awaits.
    return null;
  }
}
