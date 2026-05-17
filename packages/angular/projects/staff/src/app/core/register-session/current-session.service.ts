import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  CloseRegisterSessionGQL,
  MyCurrentRegisterSessionGQL,
  OpenRegisterSessionGQL,
} from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export type RegisterSessionStatus = 'open' | 'closed';

export interface RegisterSession {
  readonly id: string;
  readonly dispensaryId: string;
  readonly openedByUserId: string;
  readonly openingCashCents: number;
  readonly closingCashCents?: number | null;
  readonly status: RegisterSessionStatus;
  readonly openedAt: string;
  readonly closedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CurrentSessionService {
  private readonly auth = inject(AuthService);
  private readonly currentGQL = inject(MyCurrentRegisterSessionGQL);
  private readonly openGQL = inject(OpenRegisterSessionGQL);
  private readonly closeGQL = inject(CloseRegisterSessionGQL);

  private readonly _session = signal<RegisterSession | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly activeSession = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasOpenSession = computed(
    () => this._session() !== null && this._session()?.status === 'open',
  );

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user?.dispensaryId) {
        this._session.set(null);
        return;
      }
      void this.refresh();
    });
  }

  async refresh(): Promise<void> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) {
      this._session.set(null);
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const result = await firstValueFrom(
        this.currentGQL.fetch({
          variables: { dispensaryId },
          fetchPolicy: 'network-only',
        }),
      );
      const row = result.data?.myCurrentRegisterSession ?? null;
      this._session.set(row as unknown as RegisterSession | null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load register session';
      this._error.set(message);
      this._session.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  async open(openingCashCents: number): Promise<RegisterSession> {
    const dispensaryId = this.auth.user()?.dispensaryId;
    if (!dispensaryId) {
      throw new Error('No dispensary scope to open a register session against');
    }
    const result = await firstValueFrom(
      this.openGQL.mutate({
        variables: { input: { dispensaryId, openingCashCents } },
      }),
    );
    const row = result.data?.openRegisterSession;
    if (!row) throw new Error('openRegisterSession returned no row');
    const session = row as unknown as RegisterSession;
    this._session.set(session);
    return session;
  }

  async close(closingCashCents: number): Promise<RegisterSession> {
    const current = this._session();
    if (!current) {
      throw new Error('No open register session to close');
    }
    const result = await firstValueFrom(
      this.closeGQL.mutate({
        variables: { input: { sessionId: current.id, closingCashCents } },
      }),
    );
    const row = result.data?.closeRegisterSession;
    if (!row) throw new Error('closeRegisterSession returned no row');
    const session = row as unknown as RegisterSession;
    this._session.set(null);
    return session;
  }
}
