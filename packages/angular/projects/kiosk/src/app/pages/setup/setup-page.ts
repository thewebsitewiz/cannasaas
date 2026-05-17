import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'cs-setup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-[#0a1a0f] p-8">
      <div class="w-full max-w-2xl space-y-8 rounded-3xl bg-white p-10 shadow-xl">
        <div>
          <h1
            class="text-3xl font-light text-gray-900"
            style="font-family: 'Playfair Display', Georgia, serif;"
          >
            Kiosk Setup
          </h1>
          <p class="mt-2 text-base text-gray-500">
            This kiosk needs a device token from your dispensary admin. Tokens are issued once via
            the
            <code class="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm text-gray-700"
              >provisionKiosk</code
            >
            mutation and last about a year.
          </p>
        </div>

        <form (submit)="onSubmit($event)" class="space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-gray-700"> Paste device token </span>
            <textarea
              rows="6"
              [value]="pasted()"
              (input)="onPaste($any($event.target).value)"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              class="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            ></textarea>
          </label>

          @if (error(); as err) {
            <div
              class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {{ err }}
            </div>
          }

          <button
            type="submit"
            [disabled]="pasted().trim().length === 0"
            class="w-full rounded-full bg-emerald-600 py-4 text-lg font-bold text-white active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Activate Kiosk
          </button>
        </form>

        <div class="border-t border-gray-100 pt-6 text-sm text-gray-400">
          <p class="font-semibold text-gray-600">Tip for admins</p>
          <p class="mt-1 leading-relaxed">
            Run the
            <code class="rounded bg-gray-100 px-1.5 font-mono text-xs">provisionKiosk</code>
            mutation against the API as a
            <code class="rounded bg-gray-100 px-1.5 font-mono text-xs">dispensary_admin</code>
            (or higher), then visit
            <code class="rounded bg-gray-100 px-1.5 font-mono text-xs">/setup?token=…</code>
            on this device — the token will be stored automatically.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class SetupPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pasted = signal('');
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('token');
    if (fromQuery && fromQuery.trim().length > 0) {
      this.activate(fromQuery.trim());
    }
  }

  protected onPaste(value: string): void {
    this.pasted.set(value);
    this.error.set(null);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const token = this.pasted().trim();
    if (!token) return;
    this.activate(token);
  }

  private activate(token: string): void {
    if (!looksLikeJwt(token)) {
      this.error.set('That doesn’t look like a JWT (expected three dot-separated segments).');
      return;
    }
    this.auth.setDeviceToken(token);
    void this.router.navigateByUrl('/');
  }
}

function looksLikeJwt(value: string): boolean {
  return value.split('.').length === 3 && value.length > 32;
}
