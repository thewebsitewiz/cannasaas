import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';

import { StaffingService, type Employee } from './staffing.service';

const HOURS_PER_WEEK = 40;

const ASSIGNABLE_ROLES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'dispensary_admin', label: 'Dispensary admin' },
  { value: 'budtender', label: 'Budtender' },
];

/**
 * Staff roster + KPIs + write-ops (sc-683):
 *  - Invite staff modal (email + first/last name + role)
 *  - Per-row role dropdown
 *  - Per-row deactivate with confirm
 *
 * Deactivated users grey out via opacity + a "(deactivated)" badge.
 * After a successful invite the temporary password is surfaced in a
 * one-time banner — admins should copy it before dismissing.
 */
@Component({
  selector: 'cs-staffing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-(--color-text)">Staffing</h1>
        <button
          type="button"
          (click)="openInvite()"
          aria-label="Invite staff"
          class="rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-primary-hover)"
        >
          + Invite staff
        </button>
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

      @if (lastInvite(); as invite) {
        <div
          class="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
          aria-label="Invite result"
        >
          <div class="flex-1">
            <p class="font-medium">{{ invite.user.email }} invited.</p>
            <p class="mt-1 text-xs">
              Temporary password (copy now — dismissing this banner discards it):
              <code class="ml-1 rounded bg-white px-1.5 py-0.5 font-mono text-xs">
                {{ invite.temporaryPassword }}
              </code>
            </p>
          </div>
          <button
            type="button"
            (click)="onDismissLastInvite()"
            aria-label="Dismiss invite result"
            class="text-xs"
          >
            ✕
          </button>
        </div>
      }

      @if (loading()) {
        <p
          class="rounded-xl border border-(--color-border) bg-(--color-surface) p-8 text-center text-sm text-(--color-text-muted)"
        >
          Loading staff…
        </p>
      } @else if (error(); as err) {
        <div
          class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300"
          role="alert"
        >
          <h2 class="font-semibold">Failed to load staffing</h2>
          <p class="mt-1 text-sm">{{ loadErrorMessage() }}</p>
        </div>
      } @else {
        <!-- KPIs -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ compliance()?.activeEmployees ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Active staff</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-emerald-500 tabular-nums">
              {{ compliance()?.activeCerts ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Active certs</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-amber-500 tabular-nums">
              {{ compliance()?.expiringSoon ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Expiring soon</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-rose-500 tabular-nums">
              {{ compliance()?.expiredCerts ?? 0 }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Expired</p>
          </article>
          <article
            class="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center"
          >
            <p class="text-2xl font-bold text-(--color-text) tabular-nums">
              {{ estimatedWeeklyPayrollLabel() }}
            </p>
            <p class="text-xs text-(--color-text-secondary)">Est. weekly payroll</p>
          </article>
        </div>

        <!-- Roster -->
        <div class="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <header class="border-b border-(--color-border) px-6 py-4">
            <h2 class="text-lg font-semibold text-(--color-text)">Employee roster</h2>
          </header>
          @if (employees().length === 0) {
            <p class="p-12 text-center text-sm text-(--color-text-muted)">No employees found.</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="border-b border-(--color-border) bg-(--color-bg)">
                <tr>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Employee
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Position
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Type
                  </th>
                  <th class="px-4 py-2 text-left font-medium text-(--color-text-secondary)">
                    Role
                  </th>
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    Rate
                  </th>
                  <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                    Certs
                  </th>
                  <th class="px-4 py-2 text-center font-medium text-(--color-text-secondary)">
                    Status
                  </th>
                  <th class="px-4 py-2 text-right font-medium text-(--color-text-secondary)">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-(--color-border)">
                @for (e of employees(); track e.userId) {
                  @let busy = busyUserId() === e.userId;
                  <tr class="hover:bg-(--color-surface-hover)" [class.opacity-50]="!e.isActive">
                    <td class="px-4 py-3">
                      <p class="font-medium text-(--color-text)">
                        {{ formatName(e) }}
                        @if (!e.isActive) {
                          <span class="ml-1 text-xs text-rose-500">(deactivated)</span>
                        }
                      </p>
                      <p class="text-xs text-(--color-text-muted)">
                        @if (e.employeeNumber) {
                          {{ e.employeeNumber }} ·
                        }
                        {{ e.email }}
                      </p>
                    </td>
                    <td class="px-4 py-3 text-(--color-text-secondary)">
                      {{ e.positionName ?? '—' }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs"
                        [class]="employmentTypeClass(e.employmentType)"
                      >
                        {{ employmentTypeLabel(e.employmentType) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <select
                        [value]="e.role"
                        [disabled]="busy || !e.isActive"
                        (change)="onRoleChange(e, $event)"
                        [attr.aria-label]="'Role for ' + formatName(e)"
                        class="rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1 text-xs text-(--color-text) disabled:opacity-50"
                      >
                        @for (r of assignableRoles; track r.value) {
                          <option [value]="r.value">{{ r.label }}</option>
                        }
                        @if (!isAssignableRole(e.role)) {
                          <option [value]="e.role" disabled>{{ e.role }}</option>
                        }
                      </select>
                    </td>
                    <td class="px-4 py-3 text-right font-medium tabular-nums text-(--color-text)">
                      {{ formatRate(e.hourlyRate) }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="font-medium text-emerald-500 tabular-nums">
                        {{ e.activeCerts }}
                      </span>
                      @if (e.expiringCerts > 0) {
                        <span class="ml-1 text-amber-500">({{ e.expiringCerts }}⚠)</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs"
                        [class]="statusBadgeClass(e.employmentStatus)"
                      >
                        {{ e.employmentStatus }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      @if (e.isActive) {
                        @if (deactivatingUserId() === e.userId) {
                          <button
                            type="button"
                            (click)="onConfirmDeactivate(e)"
                            [disabled]="busy"
                            [attr.aria-label]="'Confirm deactivate ' + formatName(e)"
                            class="rounded-md bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500 disabled:opacity-50"
                          >
                            @if (busy) {
                              …
                            } @else {
                              Deactivate
                            }
                          </button>
                          <button
                            type="button"
                            (click)="cancelDeactivate()"
                            class="ml-1 rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-text-secondary)"
                          >
                            No
                          </button>
                        } @else {
                          <button
                            type="button"
                            (click)="openDeactivate(e.userId)"
                            [attr.aria-label]="'Deactivate ' + formatName(e)"
                            class="text-xs text-rose-500 hover:text-rose-400"
                          >
                            Deactivate
                          </button>
                        }
                      } @else {
                        <span class="text-xs text-(--color-text-muted)">—</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Invite modal -->
      @if (inviteOpen()) {
        <div
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Invite staff"
        >
          <form
            [formGroup]="inviteForm"
            (ngSubmit)="onSubmitInvite()"
            class="w-full max-w-md space-y-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-5"
          >
            <h2 class="text-lg font-semibold text-(--color-text)">Invite a new staff member</h2>
            <label class="block text-xs font-medium text-(--color-text-secondary)">
              Email
              <input
                type="email"
                formControlName="email"
                aria-label="Staff email"
                class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
              />
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="block text-xs font-medium text-(--color-text-secondary)">
                First name
                <input
                  type="text"
                  formControlName="firstName"
                  aria-label="Staff first name"
                  class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
                />
              </label>
              <label class="block text-xs font-medium text-(--color-text-secondary)">
                Last name
                <input
                  type="text"
                  formControlName="lastName"
                  aria-label="Staff last name"
                  class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
                />
              </label>
            </div>
            <label class="block text-xs font-medium text-(--color-text-secondary)">
              Role
              <select
                formControlName="role"
                aria-label="Staff role"
                class="mt-1 block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1.5 text-sm text-(--color-text)"
              >
                @for (r of assignableRoles; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </label>
            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="cancelInvite()"
                class="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-text-secondary)"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="inviteForm.invalid || busyUserId() === 'invite'"
                class="rounded-md bg-(--color-primary) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--color-primary-hover) disabled:opacity-50"
              >
                @if (busyUserId() === 'invite') {
                  Inviting…
                } @else {
                  Send invite
                }
              </button>
            </div>
          </form>
        </div>
      }
    </section>
  `,
})
export class StaffingPage {
  private readonly svc = inject(StaffingService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly assignableRoles = ASSIGNABLE_ROLES;
  protected readonly employees = this.svc.employees;
  protected readonly compliance = this.svc.compliance;
  protected readonly loading = this.svc.isLoading;
  protected readonly error = this.svc.error;
  protected readonly busyUserId = this.svc.busyUserId;
  protected readonly errorMessage = this.svc.errorMessage;
  protected readonly lastInvite = this.svc.lastInvite;

  protected readonly loadErrorMessage = computed(() => {
    const err = this.error();
    return err instanceof Error ? err.message : 'Unable to load staffing.';
  });

  protected readonly inviteOpen = signal<boolean>(false);
  protected readonly deactivatingUserId = signal<string | null>(null);

  /* eslint-disable @typescript-eslint/unbound-method -- false positive on Validators.* */
  protected readonly inviteForm = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    firstName: this.fb.control(''),
    lastName: this.fb.control(''),
    role: this.fb.control(ASSIGNABLE_ROLES[0].value, Validators.required),
  });
  /* eslint-enable @typescript-eslint/unbound-method */

  protected readonly estimatedWeeklyPayrollLabel = computed(() => {
    const total = this.employees()
      .filter((e) => e.employmentStatus === 'active')
      .reduce((sum, e) => sum + (e.hourlyRate ?? 0) * HOURS_PER_WEEK, 0);
    return (
      '$' +
      total.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    );
  });

  protected formatName(e: Employee): string {
    const first = e.firstName ?? '';
    const last = e.lastName ?? '';
    const name = (first + ' ' + last).trim();
    return name || e.email;
  }

  protected formatRate(rate: number | null | undefined): string {
    if (rate == null) return '—';
    return '$' + rate.toFixed(2) + '/hr';
  }

  protected statusBadgeClass(status: string): string {
    return status === 'active'
      ? 'bg-emerald-500/10 text-emerald-500'
      : 'bg-rose-500/10 text-rose-500';
  }

  protected employmentTypeLabel(type: string): string {
    if (type === 'full_time') return 'Full-time';
    if (type === 'part_time') return 'Part-time';
    return type.replace(/_/g, ' ');
  }

  protected employmentTypeClass(type: string): string {
    return type === 'full_time'
      ? 'bg-sky-500/10 text-sky-500'
      : 'bg-(--color-surface-hover) text-(--color-text-secondary)';
  }

  protected isAssignableRole(role: string): boolean {
    return ASSIGNABLE_ROLES.some((r) => r.value === role);
  }

  // ── Invite modal ───────────────────────────────────────────────────────

  protected openInvite(): void {
    this.inviteForm.reset({
      email: '',
      firstName: '',
      lastName: '',
      role: ASSIGNABLE_ROLES[0].value,
    });
    this.inviteOpen.set(true);
  }

  protected cancelInvite(): void {
    this.inviteOpen.set(false);
  }

  protected async onSubmitInvite(): Promise<void> {
    if (this.inviteForm.invalid) return;
    const { email, firstName, lastName, role } = this.inviteForm.getRawValue();
    await this.svc.invite({
      email: email.trim(),
      role,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
    });
    if (!this.errorMessage()) {
      this.inviteOpen.set(false);
    }
  }

  // ── Role + deactivate ──────────────────────────────────────────────────

  protected onRoleChange(e: Employee, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === e.role) return;
    void this.svc.setRole(e.userId, value);
  }

  protected openDeactivate(userId: string): void {
    this.deactivatingUserId.set(userId);
  }

  protected cancelDeactivate(): void {
    this.deactivatingUserId.set(null);
  }

  protected async onConfirmDeactivate(e: Employee): Promise<void> {
    await this.svc.deactivate(e.userId);
    this.deactivatingUserId.set(null);
  }

  protected onDismissError(): void {
    this.svc.clearError();
  }

  protected onDismissLastInvite(): void {
    this.svc.clearLastInvite();
  }
}
