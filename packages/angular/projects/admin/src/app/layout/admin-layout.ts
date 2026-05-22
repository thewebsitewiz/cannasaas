import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';
import { NavIcon, type NavIconName } from './nav-icon';
import { StockAlertToast } from './stock-alert-toast';

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: NavIconName;
  readonly superOnly?: boolean;
  readonly exact?: boolean;
}

/**
 * Mirrors the 16-item nav from the React admin's `AdminLayout.tsx`,
 * plus the 17th `Tax Rules` entry which only super_admins see.
 * Order is intentional and matches the React app one-for-one.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
  { to: '/products', label: 'Products', icon: 'package' },
  { to: '/orders', label: 'Orders', icon: 'cart' },
  { to: '/inventory', label: 'Inventory', icon: 'warehouse' },
  { to: '/compliance', label: 'Compliance', icon: 'shield-check' },
  { to: '/staffing', label: 'Staffing', icon: 'users' },
  { to: '/timeclock', label: 'Time Clock', icon: 'clock' },
  { to: '/scheduling', label: 'Scheduling', icon: 'calendar' },
  { to: '/inventory-control', label: 'Inv. Control', icon: 'swap' },
  { to: '/vendors', label: 'Vendors', icon: 'building' },
  { to: '/loyalty', label: 'Loyalty', icon: 'star' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/menu-board', label: 'Menu Board', icon: 'monitor' },
  { to: '/tax-management', label: 'Tax Rules', icon: 'receipt', superOnly: true },
  { to: '/menu-categories', label: 'Menu Categories', icon: 'list' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

@Component({
  selector: 'cs-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavIcon, StockAlertToast],
  template: `
    <div class="flex min-h-screen bg-(--color-bg) text-(--color-text)">
      <aside
        class="flex w-64 flex-col border-r border-(--color-border) bg-(--color-surface)"
        role="navigation"
        aria-label="Main navigation"
      >
        <div class="border-b border-(--color-border) p-6">
          <h1 class="font-display text-xl font-bold text-(--color-primary)">CannaSaas</h1>
          <p class="mt-1 text-xs text-(--color-text-muted)">Admin Portal</p>
        </div>

        <nav class="flex-1 overflow-y-auto py-4" aria-label="Admin navigation">
          @for (item of visibleNav(); track item.to) {
            <a
              [routerLink]="item.to"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
              routerLinkActive="bg-(--color-surface-hover) text-(--color-text) border-r-2 border-(--color-primary)"
              [attr.aria-label]="item.label"
              class="flex items-center gap-3 px-6 py-3 text-sm font-medium text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-text)"
            >
              <cs-nav-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="border-t border-(--color-border) p-4">
          @if (userEmail(); as email) {
            <div
              class="mb-2 truncate text-xs text-(--color-text-muted)"
              [attr.title]="email"
              aria-label="Logged in user"
            >
              {{ email }}
            </div>
          }
          <button
            type="button"
            (click)="onLogout()"
            aria-label="Sign out"
            class="flex items-center gap-2 text-sm text-(--color-text-secondary) transition-colors hover:text-(--color-text)"
          >
            <cs-nav-icon name="logout" [size]="16" />
            Sign Out
          </button>
        </div>
      </aside>

      <main class="flex-1 overflow-auto" role="main" aria-label="Page content">
        <div class="p-8">
          <router-outlet />
        </div>
      </main>

      <cs-stock-alert-toast />
    </div>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly userEmail = computed(() => this.auth.user()?.email ?? null);

  protected readonly visibleNav = computed(() => {
    const isSuper = this.auth.role() === 'super_admin';
    return NAV_ITEMS.filter((item) => !item.superOnly || isSuper);
  });

  protected async onLogout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
