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

describe('AuthService', () => {
  let mutate: Mock;

  beforeEach(() => {
    localStorage.clear();
    mutate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: LoginGQL,
          useValue: { mutate } as unknown as LoginGQL,
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated when localStorage is empty', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('login() applies the token and decodes user claims', async () => {
    const token = makeJwt({
      sub: 'user-1',
      email: 'b@dispensary.com',
      role: 'budtender',
      dispensaryId: 'disp-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    const user = await service.login('b@dispensary.com', 'secret');

    expect(user.role).toBe('budtender');
    expect(user.dispensaryId).toBe('disp-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasDispensaryScope()).toBe(true);
    expect(localStorage.getItem('cs.staff.accessToken')).toBe(token);
  });

  it('rejects a token whose role is not in the staff role set', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'x@y.com',
      role: 'customer',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await expect(service.login('x@y.com', 'p')).rejects.toThrow(/missing required fields/);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('throws on login response missing accessToken', async () => {
    mutate.mockReturnValue(of({ data: { login: { accessToken: null } } }));
    const service = TestBed.inject(AuthService);
    await expect(service.login('x@y.com', 'p')).rejects.toThrow(/no accessToken/);
  });

  it('hasDispensaryScope: super_admin without dispensaryId still passes', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'a@a.com',
      role: 'super_admin',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await service.login('a@a.com', 'p');
    expect(service.hasDispensaryScope()).toBe(true);
  });

  it('hasDispensaryScope: dispensary_admin without dispensaryId fails', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'a@a.com',
      role: 'dispensary_admin',
      // no dispensaryId on the claims
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await service.login('a@a.com', 'p');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasDispensaryScope()).toBe(false);
  });

  it('clearToken wipes state and storage', async () => {
    const token = makeJwt({
      sub: 'u',
      email: 'a@a.com',
      role: 'budtender',
      dispensaryId: 'd-1',
    });
    mutate.mockReturnValue(of({ data: { login: { accessToken: token } } }));

    const service = TestBed.inject(AuthService);
    await service.login('a@a.com', 'p');
    service.clearToken();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('cs.staff.accessToken')).toBeNull();
  });

  it('hydrates from localStorage on construction', () => {
    const token = makeJwt({
      sub: 'u-1',
      email: 'a@a.com',
      role: 'org_admin',
      organizationId: 'org-1',
    });
    localStorage.setItem('cs.staff.accessToken', token);
    localStorage.setItem(
      'cs.staff.user',
      JSON.stringify({
        id: 'u-1',
        email: 'a@a.com',
        role: 'org_admin',
        organizationId: 'org-1',
      }),
    );

    // Re-create the module so AuthService runs its hydration ctor.
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
  });
});
