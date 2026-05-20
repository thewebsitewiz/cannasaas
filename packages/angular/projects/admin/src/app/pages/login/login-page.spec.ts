import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login-page';

function makeActivatedRoute(query: Record<string, string> = {}): ActivatedRoute {
  return {
    snapshot: { queryParamMap: convertToParamMap(query) },
  } as unknown as ActivatedRoute;
}

interface SetupArgs {
  readonly login?: ReturnType<typeof vi.fn>;
  readonly navigateByUrl?: ReturnType<typeof vi.fn>;
  readonly query?: Record<string, string>;
}

function setup(args: SetupArgs = {}) {
  const login = args.login ?? vi.fn().mockResolvedValue({ role: 'dispensary_admin' });
  const navigateByUrl = args.navigateByUrl ?? vi.fn().mockResolvedValue(true);
  const route = makeActivatedRoute(args.query ?? {});

  TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      { provide: AuthService, useValue: { login } },
      { provide: Router, useValue: { navigateByUrl } },
      { provide: ActivatedRoute, useValue: route },
    ],
  });

  const fixture = TestBed.createComponent(LoginPage);
  fixture.detectChanges();
  return { fixture, login, navigateByUrl };
}

describe('LoginPage (admin)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the sign-in heading and submit button', () => {
    const { fixture } = setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CannaSaas Admin');
    expect(text).toContain('Sign in');
  });

  it('submit is disabled while the form is invalid', () => {
    const { fixture } = setup();
    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submits valid credentials, calls auth.login and navigates to /', async () => {
    const { fixture, login, navigateByUrl } = setup();
    const root = fixture.nativeElement as HTMLElement;
    const email = root.querySelector('input[type="email"]') as HTMLInputElement;
    const password = root.querySelector('input[type="password"]') as HTMLInputElement;

    email.value = 'admin@cannasaas.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'hunter2';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(login).toHaveBeenCalledWith('admin@cannasaas.com', 'hunter2');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('honors ?redirect= query param on success', async () => {
    const { fixture, login, navigateByUrl } = setup({
      query: { redirect: '/orders/123' },
    });
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('input[type="email"]') as HTMLInputElement).value = 'a@b.com';
    (root.querySelector('input[type="email"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    (root.querySelector('input[type="password"]') as HTMLInputElement).value = 'p';
    (root.querySelector('input[type="password"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    fixture.detectChanges();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(login).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/orders/123');
  });

  it('renders an inline error when login throws', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Bad password'));
    const { fixture, navigateByUrl } = setup({ login });

    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('input[type="email"]') as HTMLInputElement).value = 'a@b.com';
    (root.querySelector('input[type="email"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    (root.querySelector('input[type="password"]') as HTMLInputElement).value = 'p';
    (root.querySelector('input[type="password"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    fixture.detectChanges();

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(navigateByUrl).not.toHaveBeenCalled();
    const alert = root.querySelector('[role="alert"]');
    expect(alert?.textContent ?? '').toContain('Bad password');
  });
});
