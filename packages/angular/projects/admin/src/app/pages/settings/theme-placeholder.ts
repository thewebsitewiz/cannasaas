import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Stand-in for `/settings/theme` until sc-636 ships the real
 * ThemePage (storefront theme picker + customizer).
 */
@Component({
  selector: 'cs-theme-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-4">
      <a
        routerLink="/settings"
        class="text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
      >
        ← Back to settings
      </a>
      <h1 class="text-2xl font-bold text-(--color-text)">Storefront theme</h1>
      <p
        class="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-sm text-(--color-text-muted)"
      >
        Theme picker + customizer lands in sc-636.
      </p>
    </section>
  `,
})
export class ThemePlaceholder {}
