import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemePage } from './theme-page';
import { ThemeService, type ThemeConfig } from './theme.service';

interface FakeArgs {
  readonly config?: ThemeConfig | null;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly saving?: boolean;
  readonly save?: ReturnType<typeof vi.fn>;
}

function makeSvc(args: FakeArgs): ThemeService {
  return {
    config: signal<ThemeConfig | null>(args.config ?? null).asReadonly(),
    isLoading: signal<boolean>(args.loading ?? false).asReadonly(),
    error: signal<unknown>(args.error ?? null).asReadonly(),
    saving: signal<boolean>(args.saving ?? false).asReadonly(),
    save: args.save ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as ThemeService;
}

function makeAuth(): AuthService {
  return {
    user: () => ({
      id: 'u-1',
      email: 'a@a.com',
      role: 'dispensary_admin',
      dispensaryId: 'disp-1',
    }),
  } as unknown as AuthService;
}

function configure(args: FakeArgs = {}) {
  const svc = makeSvc(args);
  TestBed.configureTestingModule({
    imports: [ThemePage],
    providers: [
      provideRouter([]),
      { provide: ThemeService, useValue: svc },
      { provide: AuthService, useValue: makeAuth() },
    ],
  });
  const f = TestBed.createComponent(ThemePage);
  f.detectChanges();
  return { fixture: f, svc };
}

function cfg(overrides: Partial<ThemeConfig> = {}): ThemeConfig {
  return {
    __typename: 'ThemeConfigType',
    id: 'tc-1',
    dispensaryId: 'disp-1',
    preset: 'casual',
    primary: '#2a6640',
    secondary: '#5e9b73',
    accent: '#c47820',
    bgPrimary: '#f7f2e7',
    bgSecondary: '#f0ead8',
    bgCard: '#ffffff',
    textPrimary: '#1a1a16',
    textSecondary: '#3a3a30',
    sidebarBg: '#1e4b31',
    sidebarText: '#5e9b73',
    success: '#27ae60',
    warning: '#d97706',
    error: '#c0392b',
    info: '#2e86ab',
    isDark: false,
    ...overrides,
  } as ThemeConfig;
}

describe('ThemePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders loading state', () => {
    const { fixture } = configure({ loading: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading theme…');
  });

  it('renders error banner', () => {
    const { fixture } = configure({ error: new Error('boom') });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Failed to load theme');
  });

  it('renders the preset gallery with all 12 presets', () => {
    const { fixture } = configure({ config: cfg() });
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button[aria-label^="Apply preset"]',
    );
    expect(buttons.length).toBe(12);
  });

  it('marks the active preset with aria-pressed=true', () => {
    const { fixture } = configure({ config: cfg({ preset: 'modern' }) });
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button[aria-label^="Apply preset"]',
    );
    const pressed = Array.from(buttons).filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.length).toBe(1);
    expect((pressed[0].getAttribute('aria-label') ?? '').toLowerCase()).toContain('modern');
  });

  it('renders 14 color editors split across 3 fieldsets', () => {
    const { fixture } = configure({ config: cfg() });
    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('input[type="color"]');
    expect(inputs.length).toBe(14);
    const fieldsets = (fixture.nativeElement as HTMLElement).querySelectorAll('fieldset');
    expect(fieldsets.length).toBe(3);
  });

  it('Save is disabled when local matches server', () => {
    const { fixture } = configure({ config: cfg() });
    const saveBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim().startsWith('Save')) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('changing a color enables Save and switches preset to "custom"', () => {
    const { fixture } = configure({ config: cfg() });
    const colorInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="color"][aria-label="Primary color"]',
    ) as HTMLInputElement;
    colorInput.value = '#ff0000';
    colorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim().startsWith('Save')) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'button[aria-pressed="true"][aria-label^="Apply preset"]',
    );
    expect(buttons.length).toBe(0);
  });

  it('applying a preset updates colors + active state', () => {
    const { fixture } = configure({ config: cfg({ preset: 'casual' }) });
    const modernBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Apply preset Modern Teal"]',
    ) as HTMLButtonElement;
    modernBtn.click();
    fixture.detectChanges();

    const primaryInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="color"][aria-label="Primary color"]',
    ) as HTMLInputElement;
    expect(primaryInput.value.toLowerCase()).toBe('#0a7a6a');

    const stillModern = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Apply preset Modern Teal"][aria-pressed="true"]',
    );
    expect(stillModern).not.toBeNull();
  });

  it('Save submits the full color payload with active preset to the service', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { fixture } = configure({ config: cfg(), save });

    const modernBtn = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Apply preset Modern Teal"]',
    ) as HTMLButtonElement;
    modernBtn.click();
    fixture.detectChanges();

    const saveBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim().startsWith('Save')) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();

    expect(save).toHaveBeenCalledTimes(1);
    const callArg = save.mock.calls[0][0] as {
      dispensaryId: string;
      preset: string;
      primary: string;
      isDark: boolean;
    };
    expect(callArg.dispensaryId).toBe('disp-1');
    expect(callArg.preset).toBe('modern');
    expect(callArg.primary.toLowerCase()).toBe('#0a7a6a');
    expect(callArg.isDark).toBe(false);
  });

  it('Reset restores colors from the server snapshot', () => {
    const { fixture } = configure({ config: cfg() });
    const colorInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="color"][aria-label="Primary color"]',
    ) as HTMLInputElement;
    colorInput.value = '#ff0000';
    colorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const resetBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => (b.textContent ?? '').trim() === 'Reset') as HTMLButtonElement;
    resetBtn.click();
    fixture.detectChanges();

    const refreshed = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="color"][aria-label="Primary color"]',
    ) as HTMLInputElement;
    expect(refreshed.value.toLowerCase()).toBe('#2a6640');
  });

  it('Dark theme checkbox flips isDark + marks preset custom', () => {
    const { fixture } = configure({ config: cfg() });
    const darkCheckbox = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="checkbox"][aria-label="Dark theme"]',
    ) as HTMLInputElement;
    darkCheckbox.checked = true;
    darkCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const stillCasual = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Apply preset Casual Earthy"][aria-pressed="true"]',
    );
    expect(stillCasual).toBeNull();
  });
});
