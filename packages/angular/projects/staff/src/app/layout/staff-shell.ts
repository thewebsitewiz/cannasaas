import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '@cannasaas/ui-ng';
import { AuthService } from '../core/auth/auth.service';

type ToggleableTheme = 'modern' | 'dark';

const STORAGE_KEY = 'cs.staff.theme';

@Component({
  selector: 'cs-staff-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text)">
      <header
        class="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-3"
      >
        <h1 class="text-lg font-semibold">CannaSaaS Staff</h1>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-surface-hover)"
            (click)="onToggleTheme()"
            [attr.aria-label]="
              currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            "
          >
            {{ currentTheme() === 'dark' ? '☀ Light' : '☾ Dark' }}
          </button>
          @if (userEmail(); as email) {
            <span class="text-sm text-(--color-text-muted)">{{ email }}</span>
          }
          <button
            type="button"
            class="rounded-md bg-(--color-primary) px-3 py-1.5 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
            (click)="onLogout()"
          >
            Sign out
          </button>
        </div>
      </header>
      <main class="flex-1 p-4">
        <router-outlet />
      </main>
    </div>
  `,
})
export class StaffShell {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly userEmail = computed(() => this.auth.user()?.email ?? null);
  protected readonly currentTheme = this.theme.current;

  constructor() {
    const stored = readStoredTheme();
    if (stored) this.theme.setTheme(stored);
  }

  protected onToggleTheme(): void {
    const next: ToggleableTheme = this.theme.current() === 'dark' ? 'modern' : 'dark';
    this.theme.setTheme(next);
    writeStoredTheme(next);
  }

  protected async onLogout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}

function readStoredTheme(): ToggleableTheme | null {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'modern' || value === 'dark' ? value : null;
}

function writeStoredTheme(theme: ToggleableTheme): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, theme);
}
