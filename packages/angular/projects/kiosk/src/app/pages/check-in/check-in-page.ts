import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerByPhoneGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { environment } from '../../../environments/environment';

type Status = 'idle' | 'loading' | 'matched' | 'no-match';

@Component({
  selector: 'cs-check-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 py-10">
      <h1 class="font-display text-4xl font-light text-gray-900">Check in</h1>
      <p class="mt-2 text-base text-gray-500">Enter your phone number to load your account.</p>

      <div
        class="mt-6 flex h-16 w-full items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-3xl font-light tracking-widest text-gray-900 tabular-nums"
        aria-live="polite"
      >
        {{ display() }}
      </div>

      @if (status() === 'matched' && customer(); as c) {
        <div
          class="mt-4 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
          role="status"
        >
          <p class="text-base font-semibold">{{ greeting(c) }}</p>
          <p class="text-sm">Loyalty: {{ c.loyaltyPoints }} pts</p>
        </div>
      }

      @if (status() === 'no-match') {
        <div
          class="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
          role="status"
        >
          We didn't find an account with that number. You can continue as a walk-in.
        </div>
      }

      @if (error(); as err) {
        <div
          class="mt-4 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {{ err }}
        </div>
      }

      <div class="mt-6 grid w-full grid-cols-3 gap-3">
        @for (key of digitKeys; track key) {
          <button
            type="button"
            class="flex h-16 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-2xl font-semibold text-gray-900 active:bg-gray-100 disabled:opacity-40"
            [disabled]="phone().length >= 10 || status() === 'loading'"
            (click)="onDigit(key)"
            [attr.aria-label]="key"
          >
            {{ key }}
          </button>
        }
        <button
          type="button"
          class="flex h-16 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-700 active:bg-gray-100 disabled:opacity-40"
          [disabled]="phone().length === 0 || status() === 'loading'"
          (click)="onClear()"
          aria-label="Clear"
        >
          Clear
        </button>
        <button
          type="button"
          class="flex h-16 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-2xl font-semibold text-gray-900 active:bg-gray-100 disabled:opacity-40"
          [disabled]="phone().length >= 10 || status() === 'loading'"
          (click)="onDigit('0')"
          aria-label="0"
        >
          0
        </button>
        <button
          type="button"
          class="flex h-16 items-center justify-center rounded-2xl border-2 border-gray-200 bg-white text-base font-semibold text-gray-700 active:bg-gray-100 disabled:opacity-40"
          [disabled]="phone().length === 0 || status() === 'loading'"
          (click)="onBackspace()"
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>

      <button
        type="button"
        class="mt-6 w-full rounded-full bg-emerald-600 py-4 text-lg font-bold text-white active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
        [disabled]="!canSubmit()"
        (click)="onSubmit()"
      >
        @if (status() === 'loading') {
          Looking up…
        } @else if (status() === 'matched') {
          Continue
        } @else {
          Look up
        }
      </button>

      <button
        type="button"
        class="mt-3 w-full rounded-full border-2 border-gray-200 bg-white py-4 text-base font-semibold text-gray-700 active:bg-gray-100"
        (click)="onWalkIn()"
      >
        Continue as walk-in
      </button>
    </section>
  `,
})
export class CheckInPage {
  protected readonly digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly customerByPhone = inject(CustomerByPhoneGQL);

  protected readonly phone = signal('');
  protected readonly status = signal<Status>('idle');
  protected readonly customer = signal<{
    customerId: string;
    firstName: string | null;
    lastName: string | null;
    loyaltyPoints: number;
  } | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly display = computed(() => formatPhone(this.phone()));
  protected readonly canSubmit = computed(() => {
    if (this.status() === 'loading') return false;
    if (this.status() === 'matched') return true;
    return this.phone().length === 10;
  });

  protected onDigit(digit: string): void {
    if (this.phone().length >= 10) return;
    this.phone.update((p) => p + digit);
    this.resetStatusOnEdit();
  }

  protected onBackspace(): void {
    this.phone.update((p) => p.slice(0, -1));
    this.resetStatusOnEdit();
  }

  protected onClear(): void {
    this.phone.set('');
    this.resetStatusOnEdit();
  }

  protected async onSubmit(): Promise<void> {
    if (this.status() === 'matched') {
      const c = this.customer();
      if (c) this.cart.setCustomer(c);
      void this.router.navigateByUrl('/');
      return;
    }
    if (this.phone().length !== 10) return;

    this.status.set('loading');
    this.error.set(null);
    try {
      const result = await firstValueFrom(
        this.customerByPhone.fetch({
          variables: {
            dispensaryId: environment.dispensaryId,
            phone: this.phone(),
          },
          fetchPolicy: 'network-only',
        }),
      );
      const match = result.data?.customerByPhone;
      if (match) {
        this.customer.set({
          customerId: match.customerId,
          firstName: match.firstName ?? null,
          lastName: match.lastName ?? null,
          loyaltyPoints: match.loyaltyPoints,
        });
        this.status.set('matched');
      } else {
        this.customer.set(null);
        this.status.set('no-match');
      }
    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Lookup failed');
      this.status.set('idle');
    }
  }

  protected onWalkIn(): void {
    this.cart.setCustomer(null);
    void this.router.navigateByUrl('/');
  }

  protected greeting(c: { firstName: string | null; lastName: string | null }): string {
    const name = c.firstName ?? c.lastName ?? 'there';
    return `Welcome back, ${name}!`;
  }

  private resetStatusOnEdit(): void {
    if (this.status() !== 'loading') {
      this.status.set('idle');
      this.customer.set(null);
      this.error.set(null);
    }
  }
}

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}
