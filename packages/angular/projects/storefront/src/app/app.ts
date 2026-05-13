import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartStore } from '@cannasaas/stores/angular';
import { AppThemeService } from './core/theme/app-theme.service';
import { DispensaryContextService } from './core/tenant/dispensary-context.service';

@Component({
  selector: 'cs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private readonly theme = inject(AppThemeService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly cart = inject(CartStore);

  constructor() {
    // Cart is per-tenant; rehydrate from localStorage whenever the slug changes.
    effect(() => {
      this.cart.setTenant(this.dispensary.slug());
    });

    // Re-apply the theme whenever the resolved dispensary entityId changes.
    // Falls back to the default theme if the tenant has no theme_config row.
    effect(() => {
      void this.dispensary.entityId();
      void this.theme.applyForCurrentTenant();
    });
  }
}
