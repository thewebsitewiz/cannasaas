import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { LoginGQL } from '@cannasaas/ui-ng';
import { AuthService } from './auth.service';

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt(claims: Record<string, unknown>): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify(claims));
  return `${header}.${payload}.sig`;
}

describe('AuthService (admin)', () => {
  let mutate: Mock;

  beforeEach(() => {
    sessionStorage.clear();
    mutate = vi.fn();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: LoginGQL, useValue: { mutate } as unknown as LoginGQL }],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts unauthenticated when sessionStorage is empty', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.role()).toBeNull();
  });

  it('login() applies the token and decodes user claims', async () => {
    const token = makeJwt({
      sub: 'user-1',
      email: 'a@dispensary.com',
      role: 'dispensary_admin',
      dispensaryId: 'disp-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    const user = await service.login('a@dispensary.com', 'secret');

    expect(user.role).toBe('dispensary_admin');
    expect(user.dispensaryId).toBe('disp-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('dispensary_admin');
    expect(sessionStorage.getItem('cs.admin.accessToken')).toBe(token);
  });

  it('rejects a token whose role is not in ADMIN_BASELINE_ROLES (budtender excluded)', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'b@dispensary.com',
      role: 'budtender',
      dispensaryId: 'disp-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await expect(service.login('b@dispensary.com', 'p')).rejects.toThrow(/missing required fields/);
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('cs.admin.accessToken')).toBeNull();
  });

  it('rejects a customer role token', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'c@x.com',
      role: 'customer',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));
    const service = TestBed.inject(AuthService);
    await expect(service.login('c@x.com', 'p')).rejects.toThrow(/missing required fields/);
  });

  it('throws on login response missing accessToken', async () => {
    mutate.mockReturnValue(of({ data: { login: { accessToken: null } } }));
    const service = TestBed.inject(AuthService);
    await expect(service.login('x@y.com', 'p')).rejects.toThrow(/no accessToken/);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('accepts super_admin without a dispensaryId claim', async () => {
    const token = makeJwt({
      sub: 'sa-1',
      email: 'super@platform.com',
      role: 'super_admin',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    const user = await service.login('super@platform.com', 'p');
    expect(user.role).toBe('super_admin');
    expect(user.dispensaryId).toBeUndefined();
    expect(service.isAuthenticated()).toBe(true);
  });

  it('accepts org_admin with organizationId claim', async () => {
    const token = makeJwt({
      sub: 'oa-1',
      email: 'org@co.com',
      role: 'org_admin',
      organizationId: 'org-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    const user = await service.login('org@co.com', 'p');
    expect(user.role).toBe('org_admin');
    expect(user.organizationId).toBe('org-1');
  });

  it('clearToken wipes state and sessionStorage', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'a@a.com',
      role: 'dispensary_admin',
      dispensaryId: 'd-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await service.login('a@a.com', 'p');
    service.clearToken();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(sessionStorage.getItem('cs.admin.accessToken')).toBeNull();
    expect(sessionStorage.getItem('cs.admin.user')).toBeNull();
  });

  it('rejects a malformed JWT', async () => {
    mutate.mockReturnValue(of({ data: { login: { accessToken: 'not-a-jwt' } } }));
    const service = TestBed.inject(AuthService);
    await expect(service.login('x@y.com', 'p')).rejects.toThrow(/missing required fields/);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('hydrates from sessionStorage on construction', () => {
    const token = makeJwt({
      sub: 'u-1',
      email: 'a@a.com',
      role: 'org_admin',
      organizationId: 'org-1',
    });
    sessionStorage.setItem('cs.admin.accessToken', token);
    sessionStorage.setItem(
      'cs.admin.user',
      JSON.stringify({
        id: 'u-1',
        email: 'a@a.com',
        role: 'org_admin',
        organizationId: 'org-1',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: LoginGQL, useValue: { mutate: vi.fn() } as unknown as LoginGQL },
      ],
    });

    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.role).toBe('org_admin');
    expect(service.role()).toBe('org_admin');
  });

  it('logout() clears local state even when the server call fails', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'a@a.com',
      role: 'dispensary_admin',
      dispensaryId: 'd-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const service = TestBed.inject(AuthService);
    await service.login('a@a.com', 'p');
    await service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('cs.admin.accessToken')).toBeNull();
    fetchSpy.mockRestore();
  });
});
