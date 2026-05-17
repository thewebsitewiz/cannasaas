import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import {
  CloseRegisterSessionGQL,
  MyCurrentRegisterSessionGQL,
  OpenRegisterSessionGQL,
} from '@cannasaas/ui-ng';
import { CurrentSessionService } from './current-session.service';
import { AuthService } from '../auth/auth.service';

interface Stubs {
  fetch: ReturnType<typeof vi.fn>;
  openMutate: ReturnType<typeof vi.fn>;
  closeMutate: ReturnType<typeof vi.fn>;
}

function configure(authedUser: { dispensaryId?: string } | null): Stubs {
  const fetch = vi.fn();
  const openMutate = vi.fn();
  const closeMutate = vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      CurrentSessionService,
      {
        provide: AuthService,
        useValue: { user: () => authedUser },
      },
      {
        provide: MyCurrentRegisterSessionGQL,
        useValue: { fetch } as unknown as MyCurrentRegisterSessionGQL,
      },
      {
        provide: OpenRegisterSessionGQL,
        useValue: { mutate: openMutate } as unknown as OpenRegisterSessionGQL,
      },
      {
        provide: CloseRegisterSessionGQL,
        useValue: { mutate: closeMutate } as unknown as CloseRegisterSessionGQL,
      },
    ],
  });
  return { fetch, openMutate, closeMutate };
}

describe('CurrentSessionService', () => {
  it('starts with no session when no user is authed', async () => {
    configure(null);
    const service = TestBed.inject(CurrentSessionService);
    await new Promise((r) => setTimeout(r, 0));
    expect(service.activeSession()).toBeNull();
    expect(service.hasOpenSession()).toBe(false);
  });

  it('loads the current open session on auth + dispensary present', async () => {
    const stubs = configure({ dispensaryId: 'd-1' });
    stubs.fetch.mockReturnValue(
      of({
        data: {
          myCurrentRegisterSession: {
            id: 's-1',
            dispensaryId: 'd-1',
            openedByUserId: 'u-1',
            openingCashCents: 25000,
            status: 'open',
            openedAt: '2026-05-17T12:00:00Z',
          },
        },
      }),
    );
    const service = TestBed.inject(CurrentSessionService);
    await service.refresh();
    expect(stubs.fetch).toHaveBeenCalled();
    expect(service.activeSession()?.id).toBe('s-1');
    expect(service.hasOpenSession()).toBe(true);
  });

  it('open() posts the mutation and updates the signal', async () => {
    const stubs = configure({ dispensaryId: 'd-1' });
    stubs.fetch.mockReturnValue(of({ data: { myCurrentRegisterSession: null } }));
    stubs.openMutate.mockReturnValue(
      of({
        data: {
          openRegisterSession: {
            id: 's-new',
            dispensaryId: 'd-1',
            openedByUserId: 'u-1',
            openingCashCents: 30000,
            status: 'open',
            openedAt: '2026-05-17T13:00:00Z',
          },
        },
      }),
    );
    const service = TestBed.inject(CurrentSessionService);
    const session = await service.open(30000);
    expect(stubs.openMutate).toHaveBeenCalledWith({
      variables: { input: { dispensaryId: 'd-1', openingCashCents: 30000 } },
    });
    expect(session.openingCashCents).toBe(30000);
    expect(service.hasOpenSession()).toBe(true);
  });

  it('close() requires an open session', async () => {
    const stubs = configure({ dispensaryId: 'd-1' });
    stubs.fetch.mockReturnValue(of({ data: { myCurrentRegisterSession: null } }));
    const service = TestBed.inject(CurrentSessionService);
    await service.refresh();
    await expect(service.close(0)).rejects.toThrow(/No open register session/);
  });

  it('refresh() captures error message on failure', async () => {
    const stubs = configure({ dispensaryId: 'd-1' });
    stubs.fetch.mockReturnValue(throwError(() => new Error('boom')));
    const service = TestBed.inject(CurrentSessionService);
    await service.refresh();
    expect(service.error()).toBe('boom');
    expect(service.activeSession()).toBeNull();
  });
});
