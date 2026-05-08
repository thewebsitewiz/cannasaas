import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '@cannasaas/ui-ng';
import { AttractMode } from './shared/attract-mode/attract-mode';
import { AuthService } from './core/auth/auth.service';
import { CartService } from './core/cart/cart.service';
import { IdleService } from './core/idle/idle.service';

@Component({
  selector: 'cs-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AttractMode],
  template: `
    <router-outlet />
    @if (idle.isIdle()) {
      <cs-attract-mode (exit)="onAttractExit()" />
    }
  `,
})
export class App implements OnInit {
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  protected readonly idle = inject(IdleService);

  ngOnInit(): void {
    this.theme.setTheme('casual');
    this.idle.start();
    this.auth.ensureLoggedIn().catch((err: unknown) => {
      console.error('[App] Kiosk login failed', err);
      const message = err instanceof Error ? err.message : '';
      if (message === 'KIOSK_NOT_PROVISIONED' && !this.router.url.startsWith('/setup')) {
        void this.router.navigateByUrl('/setup');
      }
    });
  }

  protected onAttractExit(): void {
    this.cart.clearCart();
    this.idle.reset();
    void this.router.navigateByUrl('/');
  }
}
