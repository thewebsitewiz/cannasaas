import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgeGateService } from './core/age-gate/age-gate.service';
import { AppThemeService } from './core/theme/app-theme.service';
import { DispensaryContextService } from './core/tenant/dispensary-context.service';
import { AgeGateOverlay } from './layout/age-gate-overlay';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  selector: 'cs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Footer, Header, AgeGateOverlay],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    @if (gateConfirmed()) {
      <cs-header />
      <main class="flex-1">
        <router-outlet />
      </main>
      <cs-footer />
    } @else {
      <cs-age-gate-overlay />
    }
  `,
})
export class App {
  private readonly theme = inject(AppThemeService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly gate = inject(AgeGateService);

  protected readonly gateConfirmed = this.gate.confirmed;

  constructor() {
    // Re-apply the theme whenever the resolved dispensary entityId changes.
    // Falls back to the default theme if the tenant has no theme_config row.
    effect(() => {
      void this.dispensary.entityId();
      void this.theme.applyForCurrentTenant();
    });
  }
}
