import { Injectable } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { fontStackFor, findGoogleFont } from './fonts';
import type { ThemeConfig } from './theme-config.entity';

/**
 * Builds the single CSS file served at `GET /css/dispensary/:id.css`.
 * Output: a `@import` line for any chosen Google Fonts (deduped if both
 * display and body use the same family) followed by a `:root` block of
 * every theme custom property. Designed to be link-injected at runtime
 * by storefront / admin / staff / kiosk apps.
 */
@Injectable()
export class ThemeCssService {
  constructor(private readonly themes: ThemeService) {}

  async generate(
    dispensaryId: string,
  ): Promise<{ css: string; updatedAt: Date }> {
    const config = await this.themes.getByDispensaryId(dispensaryId);
    return {
      css: this.render(config),
      updatedAt: config.updatedAt ?? new Date(0),
    };
  }

  private render(config: ThemeConfig): string {
    const fontImports = this.collectFontImports(config);
    const root = this.renderRoot(config);
    const header = `/* per-dispensary theme — generated, do not edit by hand
 * dispensaryId=${config.dispensaryId} preset=${config.preset}
 */`;
    return [header, ...fontImports, root].join('\n\n') + '\n';
  }

  private collectFontImports(config: ThemeConfig): string[] {
    const display = findGoogleFont(config.displayFont);
    const body = findGoogleFont(config.bodyFont);
    const urls = new Set<string>();
    if (display) urls.add(display.url);
    if (body) urls.add(body.url);
    return [...urls].map((u) => `@import url('${u}');`);
  }

  private renderRoot(config: ThemeConfig): string {
    // Only emit a --font-* declaration when the family is in the
    // curated allowlist — keeps random / wrong values out of the
    // generated CSS and forces the fallback stack to take over.
    const displayStack =
      config.displayFont && findGoogleFont(config.displayFont)
        ? fontStackFor(config.displayFont, 'display')
        : null;
    const bodyStack =
      config.bodyFont && findGoogleFont(config.bodyFont)
        ? fontStackFor(config.bodyFont, 'body')
        : null;

    const decls: string[] = [
      `  --color-primary: ${config.primary};`,
      `  --color-secondary: ${config.secondary};`,
      `  --color-accent: ${config.accent};`,
      `  --color-bg: ${config.bgPrimary};`,
      `  --color-bg-secondary: ${config.bgSecondary};`,
      `  --color-bg-card: ${config.bgCard};`,
      `  --color-text: ${config.textPrimary};`,
      `  --color-text-secondary: ${config.textSecondary};`,
      `  --color-sidebar-bg: ${config.sidebarBg};`,
      `  --color-sidebar-text: ${config.sidebarText};`,
      `  --color-success: ${config.success};`,
      `  --color-warning: ${config.warning};`,
      `  --color-error: ${config.error};`,
      `  --color-info: ${config.info};`,
      `  --color-scheme: ${config.isDark ? 'dark' : 'light'};`,
    ];
    if (displayStack) decls.push(`  --font-display: ${displayStack};`);
    if (bodyStack) decls.push(`  --font-body: ${bodyStack};`);
    if (config.logoUrl)
      decls.push(`  --brand-logo-url: url('${config.logoUrl}');`);
    if (config.mastheadUrl)
      decls.push(`  --brand-masthead-url: url('${config.mastheadUrl}');`);

    return `:root {\n${decls.join('\n')}\n}`;
  }
}
