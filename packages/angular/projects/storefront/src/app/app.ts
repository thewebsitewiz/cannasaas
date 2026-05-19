import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgeGateService } from './core/age-gate/age-gate.service';
import { AppThemeService } from './core/theme/app-theme.service';
import { CartStockGuardianService } from './core/stock-updates/cart-stock-guardian.service';
import { DispensaryContextService } from './core/tenant/dispensary-context.service';
import { AgeGateOverlay } from './layout/age-gate-overlay';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { StockEvictionToasts } from './layout/stock-eviction-toasts';

@Component({
  selector: 'cs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Footer, Header, AgeGateOverlay, StockEvictionToasts],
  host: { class: 'flex min-h-screen flex-col' },
  template: `
    @if (gateConfirmed()) {
      <cs-header />
      <main class="flex-1">
        <router-outlet />
      </main>
      <cs-footer />
      <cs-stock-eviction-toasts />
    } @else {
      <cs-age-gate-overlay />
    }
  `,
})
export class App {
  private readonly theme = inject(AppThemeService);
  private readonly dispensary = inject(DispensaryContextService);
  private readonly gate = inject(AgeGateService);
  // Inject the guardian so its constructor effect wires up — it watches
  // live stock and prunes the cart on out_of_stock.
  private readonly cartGuardian = inject(CartStockGuardianService);

  protected readonly gateConfirmed = this.gate.confirmed;

  constructor() {
    // Re-apply the theme whenever the resolved dispensary entityId changes.
    // Falls back to the default theme if the tenant has no theme_config row.
    effect(() => {
      void this.dispensary.entityId();
      void this.theme.applyForCurrentTenant();
    });
    // Silence unused-warning for the eagerly-injected guardian.
    void this.cartGuardian;
  }
}
