import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthService } from '../core/auth/auth.service';

/**
 * Stand-in for the DashboardPage that lands in sc-624. AdminLayout
 * (sc-623) is shipping ahead of the per-page ports, so the `/` slot
 * needs something to render. Deleted when DashboardPage ships.
 */
@Component({
  selector: 'cs-dashboard-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-(--color-border) bg-(--color-surface) p-8">
      <h2 class="font-display text-2xl font-bold">Dashboard</h2>
      @if (user(); as u) {
        <p class="mt-2 text-sm text-(--color-text-secondary)">
          Signed in as <b>{{ u.email }}</b> ({{ u.role }}).
        </p>
      }
      <p class="mt-4 text-sm text-(--color-text-muted)">
        KPI cards, charts, and the low-stock widget land in sc-624.
      </p>
    </div>
  `,
})
export class DashboardPlaceholder {
  private readonly auth = inject(AuthService);
  protected readonly user = this.auth.user;
}
