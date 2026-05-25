import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DispensaryProcessorName } from '@cannasaas/ui-ng';

import { PaymentsService } from './payments.service';

interface ProcessorMeta {
  readonly name: DispensaryProcessorName;
  readonly label: string;
  readonly description: string;
}

const PROCESSORS: readonly ProcessorMeta[] = [
  {
    name: DispensaryProcessorName.AEROPAY,
    label: 'Aeropay',
    description: 'Pay-by-bank. Customer is redirected to Aeropay to authorize.',
  },
  {
    name: DispensaryProcessorName.CANPAY,
    label: 'CanPay',
    description: 'Customer scans a QR code in the CanPay mobile app to authorize.',
  },
];

@Component({
  selector: 'cs-payments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <a
        routerLink="/settings"
        class="text-sm text-(--color-primary) hover:text-(--color-primary-hover)"
      >
        ← Back to settings
      </a>

      <header>
        <h1 class="text-2xl font-bold text-(--color-text)">Payment processors</h1>
        <p class="mt-1 text-sm text-(--color-text-muted)">
          Enable and provision the ACH-based processors your dispensary accepts. One processor may
          be marked as the default — non-cash orders use it unless explicitly overridden.
        </p>
      </header>

      @if (errorMessage(); as msg) {
        <div
          class="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700"
          role="alert"
        >
          <span class="flex-1">{{ msg }}</span>
          <button type="button" (click)="onDismissError()" aria-label="Dismiss error">✕</button>
        </div>
      }

      @if (isLoading()) {
        <p class="text-sm text-(--color-text-muted)">Loading processor config…</p>
      } @else if (loadError(); as err) {
        <p class="text-sm text-rose-500" role="alert">
          Couldn't load processors: {{ loadErrorMessage() }}
        </p>
      } @else {
        <div class="space-y-4">
          @for (p of processors; track p.name) {
            @let row = svc.rowFor(p.name);
            @let isActive = svc.active() === p.name;
            @let isProvisioned = !!row?.merchantExternalId;
            @let isFormOpen = openForm() === p.name;
            @let busy = svc.busy() === p.name;

            <section
              class="rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
              [attr.aria-label]="p.label + ' processor'"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-(--color-text)">{{ p.label }}</h2>
                    @if (isActive) {
                      <span
                        class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                      >
                        Active default
                      </span>
                    }
                    @if (row?.isSandbox && row?.isEnabled) {
                      <span
                        class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                      >
                        Sandbox
                      </span>
                    }
                  </div>
                  <p class="mt-1 text-sm text-(--color-text-muted)">{{ p.description }}</p>
                </div>
                <label class="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    [checked]="row?.isEnabled ?? false"
                    [disabled]="busy"
                    (change)="onToggleEnabled(p.name, $event)"
                    [attr.aria-label]="'Enable ' + p.label"
                    class="h-5 w-5 accent-(--color-primary)"
                  />
                  Enabled
                </label>
              </div>

              @if (row?.isEnabled) {
                <div class="space-y-3 border-t border-(--color-border) pt-3">
                  <div class="flex flex-wrap items-center gap-4 text-sm">
                    <label class="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        [checked]="row!.isSandbox"
                        [disabled]="busy"
                        (change)="onToggleSandbox(p.name, $event)"
                        [attr.aria-label]="p.label + ' sandbox mode'"
                        class="h-4 w-4 accent-(--color-primary)"
                      />
                      Sandbox mode
                    </label>
                    <label class="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="active-processor"
                        [checked]="isActive"
                        [disabled]="busy"
                        (change)="onSetActive(p.name)"
                        [attr.aria-label]="'Use ' + p.label + ' as default'"
                        class="h-4 w-4 accent-(--color-primary)"
                      />
                      Use as default
                    </label>
                    @if (isActive) {
                      <button
                        type="button"
                        (click)="onClearActive()"
                        class="text-xs text-(--color-text-muted) underline"
                      >
                        Clear default
                      </button>
                    }
                  </div>

                  @if (isProvisioned) {
                    @let testing = svc.testing() === p.name;
                    @let testResult = svc.testResultFor(p.name);
                    <div
                      class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                    >
                      <span>
                        Provisioned · merchant
                        <code class="ml-1 rounded bg-white/60 px-1.5 py-0.5 text-xs">
                          {{ row!.merchantExternalId }}
                        </code>
                      </span>
                      <div class="flex items-center gap-3">
                        @if (testResult) {
                          @if (testResult.ok) {
                            <span
                              class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                              [attr.aria-label]="'Test connection succeeded for ' + p.label"
                            >
                              ✓ Connected{{
                                testResult.latencyMs != null
                                  ? ' · ' + testResult.latencyMs + 'ms'
                                  : ''
                              }}
                            </span>
                          } @else {
                            <span
                              class="max-w-xs rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                              [attr.aria-label]="'Test connection failed for ' + p.label"
                              [attr.title]="testResult.errorMessage"
                            >
                              ✗ {{ testResult.errorMessage ?? 'Test failed' }}
                            </span>
                          }
                        }
                        <button
                          type="button"
                          (click)="onTestProcessor(p.name)"
                          [disabled]="testing || busy"
                          [attr.aria-label]="'Test connection for ' + p.label"
                          class="text-xs text-(--color-primary) underline disabled:opacity-50"
                        >
                          @if (testing) {
                            Testing…
                          } @else {
                            Test connection
                          }
                        </button>
                        <button
                          type="button"
                          (click)="onDeprovision(p.name)"
                          [disabled]="busy"
                          class="text-xs text-rose-700 underline disabled:opacity-50"
                        >
                          Deprovision
                        </button>
                      </div>
                    </div>
                  } @else {
                    <p class="text-sm text-(--color-text-muted)">
                      Not provisioned — credentials required before this processor can accept
                      payments.
                    </p>
                  }

                  @if (isFormOpen) {
                    <form
                      [formGroup]="form"
                      (ngSubmit)="onSubmitProvision(p.name)"
                      class="space-y-2 rounded-md border border-(--color-border) bg-(--color-bg) p-3"
                    >
                      <label class="block text-xs font-medium text-(--color-text-secondary)">
                        Merchant ID
                        <input
                          type="text"
                          formControlName="merchantId"
                          aria-label="Merchant ID"
                          class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1.5 text-sm text-(--color-text)"
                        />
                      </label>
                      <label class="block text-xs font-medium text-(--color-text-secondary)">
                        API key
                        <input
                          type="password"
                          formControlName="apiKey"
                          aria-label="API key"
                          class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1.5 font-mono text-sm text-(--color-text)"
                        />
                      </label>
                      <label
                        class="flex cursor-pointer items-center gap-2 text-xs text-(--color-text-secondary)"
                      >
                        <input
                          type="checkbox"
                          formControlName="isSandbox"
                          aria-label="Sandbox"
                          class="h-4 w-4 accent-(--color-primary)"
                        />
                        Sandbox (uncheck for production)
                      </label>
                      <div class="flex items-center gap-2">
                        <button
                          type="submit"
                          [disabled]="form.invalid || busy"
                          class="rounded-md bg-(--color-primary) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
                        >
                          @if (busy) {
                            Provisioning…
                          } @else {
                            Save credentials
                          }
                        </button>
                        <button
                          type="button"
                          (click)="onCancelForm()"
                          class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text)"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  } @else {
                    <button
                      type="button"
                      (click)="onOpenForm(p.name)"
                      [disabled]="busy"
                      class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text) disabled:opacity-50"
                    >
                      @if (isProvisioned) {
                        Rotate credentials
                      } @else {
                        Provision credentials
                      }
                    </button>
                  }
                </div>
              }
            </section>
          }
        </div>
      }
    </section>
  `,
})
export class PaymentsPage {
  protected readonly svc = inject(PaymentsService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly processors = PROCESSORS;
  protected readonly isLoading = this.svc.isLoading;
  protected readonly loadError = this.svc.error;
  protected readonly errorMessage = this.svc.errorMessage;

  protected readonly loadErrorMessage = computed(() => {
    const err = this.loadError();
    return err instanceof Error ? err.message : 'Unknown error.';
  });

  protected readonly openForm = signal<DispensaryProcessorName | null>(null);

  /* eslint-disable @typescript-eslint/unbound-method -- false positive on Validators.required */
  protected readonly form = this.fb.group({
    merchantId: this.fb.control('', Validators.required),
    apiKey: this.fb.control('', Validators.required),
    isSandbox: this.fb.control(true),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected onToggleEnabled(name: DispensaryProcessorName, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    void this.svc.setEnabled(name, checked);
  }

  protected onToggleSandbox(name: DispensaryProcessorName, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    void this.svc.setEnabled(name, true, checked);
  }

  protected onSetActive(name: DispensaryProcessorName): void {
    void this.svc.setActive(name);
  }

  protected onClearActive(): void {
    void this.svc.setActive(null);
  }

  protected onTestProcessor(name: DispensaryProcessorName): void {
    void this.svc.testProcessor(name);
  }

  protected onDeprovision(name: DispensaryProcessorName): void {
    if (
      !confirm(
        'Remove the credentials for this processor? Payments will stop until you re-provision.',
      )
    ) {
      return;
    }
    void this.svc.deprovision(name);
  }

  protected onOpenForm(name: DispensaryProcessorName): void {
    this.openForm.set(name);
    this.form.reset({ merchantId: '', apiKey: '', isSandbox: true });
  }

  protected onCancelForm(): void {
    this.openForm.set(null);
    this.form.reset({ merchantId: '', apiKey: '', isSandbox: true });
  }

  protected async onSubmitProvision(name: DispensaryProcessorName): Promise<void> {
    if (this.form.invalid) return;
    const { merchantId, apiKey, isSandbox } = this.form.getRawValue();
    await this.svc.provision(name, merchantId, apiKey, isSandbox);
    if (!this.errorMessage()) {
      this.onCancelForm();
    }
  }

  protected onDismissError(): void {
    this.svc.clearError();
  }
}
