import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService, type AdminRole, type AdminUser } from '../core/auth/auth.service';
import { AdminLayout } from './admin-layout';

@Component({ selector: 'cs-login-stub', template: '' })
class LoginStub {}

function makeUser(role: AdminRole, email = 'a@a.com'): AdminUser {
  return {
    id: 'u-1',
    email,
    role,
    dispensaryId: role === 'super_admin' ? undefined : 'disp-1',
  };
}

interface SetupArgs {
  readonly user?: AdminUser | null;
  readonly logout?: ReturnType<typeof vi.fn>;
}

async function setup(args: SetupArgs = {}) {
  const user = args.user === undefined ? makeUser('dispensary_admin') : args.user;
  const logout = args.logout ?? vi.fn().mockResolvedValue(undefined);

  await TestBed.configureTestingModule({
    imports: [AdminLayout],
    providers: [
      provideRouter([{ path: 'login', component: LoginStub }]),
      {
        provide: AuthService,
        useValue: {
          user: () => user,
          role: () => user?.role ?? null,
          logout,
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminLayout);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, logout };
}

function navLabels(root: HTMLElement): string[] {
  const links = root.querySelectorAll('nav[aria-label="Admin navigation"] a');
  return Array.from(links).map((el) => (el.textContent ?? '').trim());
}

describe('AdminLayout', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the CannaSaas brand + Admin Portal subhead', async () => {
    const { fixture } = await setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('CannaSaas');
    expect(text).toContain('Admin Portal');
  });

  it('renders 15 nav items for dispensary_admin (Tax Rules hidden)', async () => {
    const { fixture } = await setup({ user: makeUser('dispensary_admin') });
    const labels = navLabels(fixture.nativeElement as HTMLElement);
    expect(labels).toHaveLength(15);
    expect(labels).not.toContain('Tax Rules');
    expect(labels[0]).toBe('Dashboard');
    expect(labels.at(-1)).toBe('Settings');
  });

  it('renders 15 nav items for org_admin (Tax Rules hidden)', async () => {
    const { fixture } = await setup({ user: makeUser('org_admin') });
    const labels = navLabels(fixture.nativeElement as HTMLElement);
    expect(labels).toHaveLength(15);
    expect(labels).not.toContain('Tax Rules');
  });

  it('renders 16 nav items for super_admin (Tax Rules visible)', async () => {
    const { fixture } = await setup({ user: makeUser('super_admin') });
    const labels = navLabels(fixture.nativeElement as HTMLElement);
    expect(labels).toHaveLength(16);
    expect(labels).toContain('Tax Rules');
  });

  it('shows the signed-in user email in the sidebar footer', async () => {
    const { fixture } = await setup({
      user: makeUser('dispensary_admin', 'owner@dispensary.com'),
    });
    const footerText =
      (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Logged in user"]')
        ?.textContent ?? '';
    expect(footerText.trim()).toBe('owner@dispensary.com');
  });

  it('calls auth.logout() when Sign Out is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const { fixture } = await setup({ logout });

    const btn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Sign out"]',
    ) as HTMLButtonElement;
    btn.click();
    await fixture.whenStable();

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('hides Tax Rules but shows Settings (sanity that filter is precise)', async () => {
    const { fixture } = await setup({ user: makeUser('dispensary_admin') });
    const labels = navLabels(fixture.nativeElement as HTMLElement);
    expect(labels).toContain('Settings');
    expect(labels).toContain('Menu Categories');
    expect(labels).not.toContain('Tax Rules');
  });
});
