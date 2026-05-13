import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  constructor() {
    // Re-apply the theme whenever the resolved dispensary entityId changes.
    // Falls back to the default theme if the tenant has no theme_config row.
    effect(() => {
      void this.dispensary.entityId();
      void this.theme.applyForCurrentTenant();
    });
  }
}
