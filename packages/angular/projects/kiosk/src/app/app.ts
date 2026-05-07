import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService, THEME_NAMES, type ThemeName, MeGQL, type MeQuery } from '@cannasaas/ui-ng';

@Component({
  selector: 'cs-root',
  imports: [RouterOutlet],
  template: `
    <main class="cs-kiosk">
      <header>
        <h1>CannaSaas Kiosk</h1>
        <select (change)="onThemeChange($event)" [value]="theme.current()">
          @for (name of themes; track name) {
            <option [value]="name">{{ name }}</option>
          }
        </select>
      </header>

      <section style="margin-top: 2rem;">
        <h2>API connection test</h2>
        @if (loading()) {
          <p>Loading…</p>
        } @else if (error(); as err) {
          <p style="color: crimson;">Error: {{ err }}</p>
        } @else if (user(); as me) {
          <p>
            Connected. Authenticated as <strong>{{ me.email }}</strong> ({{ me.role }})
          </p>
        } @else {
          <p>No user — likely 401. That's expected without a JWT.</p>
        }
      </section>

      <section style="margin-top: 2rem; border: 2px solid red; padding: 1rem;">
        <h2>Diagnostic</h2>
        <p>Loading state: {{ loading() }}</p>
        <p>Error state: {{ error() }}</p>
        <p>User state: {{ user() ? 'has user' : 'no user' }}</p>
        <p>MeGQL injected: {{ meGQL ? 'yes' : 'no' }}</p>
      </section>

      <router-outlet />
    </main>
  `,
  styles: [
    `
      .cs-kiosk {
        padding: 2rem;
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `,
  ],
})
export class App implements OnInit {
  protected readonly theme = inject(ThemeService);
  protected readonly themes = THEME_NAMES;

  protected readonly meGQL = inject(MeGQL);
  protected readonly loading = signal(true);
  protected readonly user = signal<MeQuery['me'] | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.theme.setTheme('casual');

    this.meGQL.fetch().subscribe({
      next: (result) => {
        this.user.set(result.data?.me ?? null);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  onThemeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ThemeName;
    this.theme.setTheme(value);
  }
}
