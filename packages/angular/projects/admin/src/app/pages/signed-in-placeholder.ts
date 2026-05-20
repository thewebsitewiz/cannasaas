import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';

/**
 * Stand-in for the AdminLayout that lands in sc-623. Renders the
 * signed-in user's email + role so the post-login flow has somewhere
 * to land. Will be deleted when AdminLayout ships.
 */
@Component({
  selector: 'cs-signed-in-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="flex min-h-screen items-center justify-center bg-(--color-bg) text-(--color-text)"
    >
      <div
        class="max-w-md rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 text-center shadow-xl"
      >
        <h1 class="font-display text-2xl font-bold">CannaSaas Admin</h1>
        @if (user(); as u) {
          <p class="mt-2 text-sm text-(--color-text-secondary)">
            Signed in as <b>{{ u.email }}</b> ({{ u.role }}).
          </p>
        }
        <p class="mt-4 text-xs text-(--color-text-muted)">
          AdminLayout + sidebar nav land in sc-623.
        </p>
        <button
          type="button"
          (click)="onLogout()"
          class="mt-6 rounded-lg border border-(--color-border) px-4 py-2 text-sm font-medium hover:bg-(--color-surface-hover)"
        >
          Sign out
        </button>
      </div>
    </section>
  `,
})
export class SignedInPlaceholder {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected async onLogout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
