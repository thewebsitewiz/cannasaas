import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { ThemePage, buildThemeCss } from './theme-page';
import { ThemeService, type ThemeConfig } from './theme.service';
import type { ThemeColors } from './theme-presets';

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
    uploading: signal<'logo' | 'masthead' | null>(null).asReadonly(),
    themableDispensaries: signal<readonly unknown[]>([]).asReadonly(),
    activeDispensaryId: signal<string | null>('disp-1').asReadonly(),
    setActiveDispensary: vi.fn(),
    uploadLogo: vi.fn().mockResolvedValue(undefined),
    uploadMasthead: vi.fn().mockResolvedValue(undefined),
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
    displayFont: null,
    bodyFont: null,
    logoUrl: null,
    mastheadUrl: null,
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

  // ── Live preview + CSS export (sc-687) ─────────────────────────────────────

  it('renders the live preview surface with the current colors as CSS vars', () => {
    const { fixture } = configure({ config: cfg() });
    const surface = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="theme-preview-surface"]',
    ) as HTMLElement;
    expect(surface).not.toBeNull();
    const styleAttr = surface.getAttribute('style') ?? '';
    expect(styleAttr).toContain('--color-primary:#2a6640');
    expect(styleAttr).toContain('--color-bg:#f7f2e7');
    expect(styleAttr).toContain('--color-sidebar-bg:#1e4b31');
  });

  it('preview vars react to color edits without a server round-trip', () => {
    const { fixture } = configure({ config: cfg() });
    const colorInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="color"][aria-label="Primary color"]',
    ) as HTMLInputElement;
    colorInput.value = '#ff00aa';
    colorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const surface = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="theme-preview-surface"]',
    ) as HTMLElement;
    expect(surface.getAttribute('style') ?? '').toContain('--color-primary:#ff00aa');
  });

  // TC-SET-001 (sc-525): switching preset must flow into the preview
  // pane's CSS vars, not just into the color inputs.
  it('TC-SET-001 — switching preset live-previews the new color tokens', () => {
    const { fixture } = configure({ config: cfg({ preset: 'casual' }) });
    const root = fixture.nativeElement as HTMLElement;

    // Casual preset → preview should carry the casual primary (#2a6640).
    let surface = root.querySelector('[data-testid="theme-preview-surface"]') as HTMLElement;
    expect(surface.getAttribute('style') ?? '').toContain('--color-primary:#2a6640');

    // Switch to Modern Teal → preview vars update without any save.
    (
      root.querySelector('button[aria-label="Apply preset Modern Teal"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    surface = root.querySelector('[data-testid="theme-preview-surface"]') as HTMLElement;
    expect(surface.getAttribute('style') ?? '').toContain('--color-primary:#0a7a6a');
  });

  it('Download CSS button triggers an anchor download with theme.<preset>.css', () => {
    const { fixture } = configure({ config: cfg({ preset: 'modern' }) });
    const clicks: { name: string; download: string }[] = [];
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        const anchor = el as HTMLAnchorElement;
        anchor.click = () => {
          clicks.push({ name: anchor.tagName, download: anchor.download });
        };
      }
      return el;
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const btn = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'Download theme CSS',
    ) as HTMLButtonElement;
    btn.click();

    expect(clicks).toHaveLength(1);
    expect(clicks[0].download).toBe('theme.modern.css');
    createSpy.mockRestore();
  });

  // sc-637 follow-on — font picker + branding uploaders + dispensary selector

  it('TC-THEME-FONT-001 — display + body font dropdowns render with the curated catalog', () => {
    const { fixture } = configure({ config: cfg() });
    const root = fixture.nativeElement as HTMLElement;
    const displaySelect = root.querySelector(
      'select[aria-label="Display font"]',
    ) as HTMLSelectElement;
    const bodySelect = root.querySelector('select[aria-label="Body font"]') as HTMLSelectElement;
    expect(displaySelect).toBeTruthy();
    expect(bodySelect).toBeTruthy();
    // 10 display fonts + the "Use preset default" empty option
    expect(displaySelect.options.length).toBe(11);
    // 6 body fonts + the "Use preset default" empty option
    expect(bodySelect.options.length).toBe(7);
  });

  it('TC-THEME-FONT-002 — picking a display font marks the form dirty', () => {
    const { fixture } = configure({ config: cfg() });
    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector(
      'select[aria-label="Display font"]',
    ) as HTMLSelectElement;
    select.value = 'Playfair Display';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const saveBtn = Array.from(root.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').trim().startsWith('Save'),
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('TC-THEME-BRAND-001 — logo upload calls svc.uploadLogo with the chosen file', async () => {
    const { fixture, svc } = configure({ config: cfg() });
    const fileInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Upload dispensary logo"]',
    ) as HTMLInputElement;
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(svc.uploadLogo).toHaveBeenCalledWith(file);
  });

  it('TC-THEME-BRAND-002 — masthead upload calls svc.uploadMasthead with the chosen file', async () => {
    const { fixture, svc } = configure({ config: cfg() });
    const fileInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[aria-label="Upload storefront masthead"]',
    ) as HTMLInputElement;
    const file = new File(['x'], 'masthead.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(svc.uploadMasthead).toHaveBeenCalledWith(file);
  });

  it('TC-THEME-BRAND-003 — current logo + masthead URLs render as <img> previews', () => {
    const { fixture } = configure({
      config: cfg({
        logoUrl: 'http://localhost:3000/uploads/branding/d_logo.png',
        mastheadUrl: 'http://localhost:3000/uploads/branding/d_masthead.jpg',
      }),
    });
    const root = fixture.nativeElement as HTMLElement;
    const logo = root.querySelector('img[alt="Current dispensary logo"]') as HTMLImageElement;
    const masthead = root.querySelector(
      'img[alt="Current storefront masthead"]',
    ) as HTMLImageElement;
    expect(logo.src).toContain('d_logo.png');
    expect(masthead.src).toContain('d_masthead.jpg');
  });

  it('TC-THEME-SCOPE-001 — dispensary picker is hidden when only one site is themable', () => {
    const { fixture } = configure({ config: cfg() });
    const picker = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Dispensary picker"]',
    );
    expect(picker).toBeNull();
  });
});

describe('buildThemeCss (sc-687)', () => {
  const sample: ThemeColors = {
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
  };

  it('emits a :root[data-theme] block keyed by the preset id', () => {
    const css = buildThemeCss('casual', sample);
    expect(css).toContain(":root[data-theme='casual'] {");
  });

  it('includes every mapped CSS var with the editor color value', () => {
    const css = buildThemeCss('casual', sample);
    expect(css).toContain('--color-primary: #2a6640');
    expect(css).toContain('--color-bg: #f7f2e7');
    expect(css).toContain('--color-sidebar-bg: #1e4b31');
    expect(css).toContain('--color-accent: #c47820');
    expect(css).toContain('--color-text: #1a1a16');
  });

  it('emits color-scheme matching isDark', () => {
    expect(buildThemeCss('casual', { ...sample, isDark: true })).toContain('color-scheme: dark');
    expect(buildThemeCss('casual', { ...sample, isDark: false })).toContain('color-scheme: light');
  });

  it('sanitizes weird preset ids to a safe slug', () => {
    const css = buildThemeCss('Custom Theme!', sample);
    expect(css).toContain(":root[data-theme='custom-theme-'] {");
  });
});
