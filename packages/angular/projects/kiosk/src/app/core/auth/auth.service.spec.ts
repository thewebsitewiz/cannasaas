import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { LoginGQL } from '@cannasaas/ui-ng';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Covers the §3 "Automated coverage target" row for `AuthService` in
 * `packages/angular/projects/kiosk/TEST-PLAN.md`:
 *
 *   "Token precedence (device > access > null), ensureLoggedIn happy
 *    path, KIOSK_NOT_PROVISIONED error, 401 retry interaction with
 *    clearAccessToken(). The 401 retry is the highest-risk path; cover
 *    with both device-only and access-only branches."
 *
 * `environment.kioskAuth` is mutated in place per-test rather than
 * `vi.mock`-ed — Angular's Vitest builder forbids `vi.mock` for relative
 * imports, and the `readonly` modifier on the field is compile-time
 * only. `afterEach` restores the original value.
 */

const KIOSK_AUTH_CREDS = { email: 'kiosk@dev.local', password: 'dev-pass' };
const DEVICE_KEY = 'cs.kiosk.deviceToken';
const ACCESS_KEY = 'cs.kiosk.accessToken';

type MutableEnv = { kioskAuth?: typeof KIOSK_AUTH_CREDS };

interface LoginGQLMock {
  mutate: ReturnType<typeof vi.fn>;
}

function setKioskAuth(creds: typeof KIOSK_AUTH_CREDS | undefined): void {
  (environment as MutableEnv).kioskAuth = creds;
}

function makeService(mockLoginGQL?: LoginGQLMock): AuthService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AuthService,
      {
        provide: LoginGQL,
        useValue: mockLoginGQL ?? { mutate: vi.fn() },
      },
    ],
  });
  return TestBed.inject(AuthService);
}

const originalKioskAuth = (environment as MutableEnv).kioskAuth;

beforeEach(() => {
  localStorage.clear();
  setKioskAuth(undefined);
});

afterEach(() => {
  setKioskAuth(originalKioskAuth);
});

describe('AuthService — token precedence', () => {
  it('returns null when no tokens are present', () => {
    const service = makeService();
    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.hasDeviceToken()).toBe(false);
  });

  it('returns the access token when only it is present', () => {
    localStorage.setItem(ACCESS_KEY, 'access-only-jwt');
    const service = makeService();
    expect(service.accessToken()).toBe('access-only-jwt');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasDeviceToken()).toBe(false);
  });

  it('returns the device token when only it is present', () => {
    localStorage.setItem(DEVICE_KEY, 'device-only-jwt');
    const service = makeService();
    expect(service.accessToken()).toBe('device-only-jwt');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasDeviceToken()).toBe(true);
  });

  it('prefers device token over access token when both are present', () => {
    localStorage.setItem(DEVICE_KEY, 'device-jwt');
    localStorage.setItem(ACCESS_KEY, 'access-jwt');
    const service = makeService();
    expect(service.accessToken()).toBe('device-jwt');
    expect(service.hasDeviceToken()).toBe(true);
  });
});

describe('AuthService — ensureLoggedIn happy paths', () => {
  it('returns the device token without consulting LoginGQL', async () => {
    localStorage.setItem(DEVICE_KEY, 'device-jwt');
    const loginMock: LoginGQLMock = { mutate: vi.fn() };
    const service = makeService(loginMock);

    await expect(service.ensureLoggedIn()).resolves.toBe('device-jwt');
    expect(loginMock.mutate).not.toHaveBeenCalled();
  });

  it('returns a cached access token without re-running login', async () => {
    localStorage.setItem(ACCESS_KEY, 'cached-access-jwt');
    setKioskAuth(KIOSK_AUTH_CREDS);
    const loginMock: LoginGQLMock = { mutate: vi.fn() };
    const service = makeService(loginMock);

    await expect(service.ensureLoggedIn()).resolves.toBe('cached-access-jwt');
    expect(loginMock.mutate).not.toHaveBeenCalled();
  });

  it('runs LoginGQL when no token is present and creds are configured', async () => {
    setKioskAuth(KIOSK_AUTH_CREDS);
    const loginMock: LoginGQLMock = {
      mutate: vi.fn().mockReturnValue(
        of({ data: { login: { accessToken: 'fresh-login-jwt' } } }),
      ),
    };
    const service = makeService(loginMock);

    await expect(service.ensureLoggedIn()).resolves.toBe('fresh-login-jwt');
    expect(loginMock.mutate).toHaveBeenCalledTimes(1);
    expect(loginMock.mutate).toHaveBeenCalledWith({
      variables: { input: KIOSK_AUTH_CREDS },
    });
    // Token must be persisted for the next call.
    expect(localStorage.getItem(ACCESS_KEY)).toBe('fresh-login-jwt');
  });

  it('deduplicates concurrent ensureLoggedIn calls via the inflight promise', async () => {
    setKioskAuth(KIOSK_AUTH_CREDS);
    const loginMock: LoginGQLMock = {
      mutate: vi.fn().mockReturnValue(
        of({ data: { login: { accessToken: 'fresh-jwt' } } }),
      ),
    };
    const service = makeService(loginMock);

    const [a, b, c] = await Promise.all([
      service.ensureLoggedIn(),
      service.ensureLoggedIn(),
      service.ensureLoggedIn(),
    ]);

    expect([a, b, c]).toEqual(['fresh-jwt', 'fresh-jwt', 'fresh-jwt']);
    expect(loginMock.mutate).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService — KIOSK_NOT_PROVISIONED', () => {
  it('throws when no token is present and kioskAuth env is undefined', async () => {
    setKioskAuth(undefined);
    const service = makeService();

    await expect(service.ensureLoggedIn()).rejects.toThrow(
      'KIOSK_NOT_PROVISIONED',
    );
  });

  it('propagates the underlying error when LoginGQL fails', async () => {
    setKioskAuth(KIOSK_AUTH_CREDS);
    const loginMock: LoginGQLMock = {
      mutate: vi.fn().mockReturnValue(throwError(() => new Error('Network down'))),
    };
    const service = makeService(loginMock);

    await expect(service.ensureLoggedIn()).rejects.toThrow('Network down');
  });

  it('throws when login response has no accessToken', async () => {
    setKioskAuth(KIOSK_AUTH_CREDS);
    const loginMock: LoginGQLMock = {
      mutate: vi.fn().mockReturnValue(of({ data: { login: null } })),
    };
    const service = makeService(loginMock);

    await expect(service.ensureLoggedIn()).rejects.toThrow(
      'no accessToken in response',
    );
  });
});

describe('AuthService — clearAccessToken (401 retry contract)', () => {
  /**
   * The 401 retry link calls `clearAccessToken()` to force a re-login
   * on the next request. This is the highest-risk path per TEST-PLAN §3:
   * if the device-token branch ever loses its guard, a single 401 from
   * a server-side hiccup would wipe the kiosk's long-lived provisioning
   * and the device would be stranded.
   */

  it('access-only branch: clears the cached access token + persists null', () => {
    localStorage.setItem(ACCESS_KEY, 'access-jwt');
    const service = makeService();
    expect(service.accessToken()).toBe('access-jwt');

    service.clearAccessToken();

    expect(service.accessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('device-only branch: is a no-op (device token MUST survive a 401)', () => {
    localStorage.setItem(DEVICE_KEY, 'device-jwt');
    const service = makeService();
    expect(service.accessToken()).toBe('device-jwt');

    service.clearAccessToken();

    expect(service.accessToken()).toBe('device-jwt');
    expect(service.hasDeviceToken()).toBe(true);
    expect(localStorage.getItem(DEVICE_KEY)).toBe('device-jwt');
  });

  it('both-tokens branch: is a no-op (device wins the guard)', () => {
    localStorage.setItem(DEVICE_KEY, 'device-jwt');
    localStorage.setItem(ACCESS_KEY, 'access-jwt');
    const service = makeService();

    service.clearAccessToken();

    expect(service.accessToken()).toBe('device-jwt');
    expect(localStorage.getItem(DEVICE_KEY)).toBe('device-jwt');
    // Access token is left alone too — the device guard exits early
    // before any access-token mutation. This preserves the cached
    // access for future paths that downgrade the device token.
    expect(localStorage.getItem(ACCESS_KEY)).toBe('access-jwt');
  });

  it('clearToken() alias delegates to clearAccessToken (backwards compat)', () => {
    localStorage.setItem(ACCESS_KEY, 'access-jwt');
    const service = makeService();

    service.clearToken();

    expect(service.accessToken()).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });
});

describe('AuthService — token mutators', () => {
  it('setDeviceToken stores the value + clears any cached access token', () => {
    localStorage.setItem(ACCESS_KEY, 'old-access-jwt');
    const service = makeService();

    service.setDeviceToken('new-device-jwt');

    expect(service.accessToken()).toBe('new-device-jwt');
    expect(localStorage.getItem(DEVICE_KEY)).toBe('new-device-jwt');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('setDeviceToken is a no-op when called with empty string', () => {
    localStorage.setItem(DEVICE_KEY, 'existing-device-jwt');
    const service = makeService();

    service.setDeviceToken('');

    // Existing token unchanged; no clobber.
    expect(service.accessToken()).toBe('existing-device-jwt');
    expect(localStorage.getItem(DEVICE_KEY)).toBe('existing-device-jwt');
  });

  it('clearDeviceToken removes only the device key (access token survives)', () => {
    localStorage.setItem(DEVICE_KEY, 'device-jwt');
    localStorage.setItem(ACCESS_KEY, 'access-jwt');
    const service = makeService();

    service.clearDeviceToken();

    expect(service.hasDeviceToken()).toBe(false);
    expect(localStorage.getItem(DEVICE_KEY)).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBe('access-jwt');
    // With the device token gone, the access token takes over.
    expect(service.accessToken()).toBe('access-jwt');
  });
});

describe('AuthService — canSelfLogin', () => {
  it('is false when kioskAuth env is undefined (production default)', () => {
    setKioskAuth(undefined);
    const service = makeService();
    expect(service.canSelfLogin).toBe(false);
  });

  it('is true when kioskAuth env is set (dev fallback)', () => {
    setKioskAuth(KIOSK_AUTH_CREDS);
    const service = makeService();
    expect(service.canSelfLogin).toBe(true);
  });
});
