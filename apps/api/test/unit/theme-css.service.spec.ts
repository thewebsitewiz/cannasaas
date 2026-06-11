/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';

import { ThemeCssService } from '../../src/modules/theme/theme-css.service';
import { ThemeService } from '../../src/modules/theme/theme.service';
import type { ThemeConfig } from '../../src/modules/theme/theme-config.entity';

function row(overrides: Partial<ThemeConfig> = {}): ThemeConfig {
  return {
    id: 'cfg-1',
    dispensaryId: 'disp-1',
    preset: 'casual',
    primary: '#2d6a4f',
    secondary: '#74956c',
    accent: '#c47820',
    bgPrimary: '#faf6f0',
    bgSecondary: '#f0ebe3',
    bgCard: '#ffffff',
    textPrimary: '#2c2418',
    textSecondary: '#6b5e4f',
    sidebarBg: '#1b3a2a',
    sidebarText: '#c8d8c4',
    success: '#27ae60',
    warning: '#d97706',
    error: '#c0392b',
    info: '#2e86ab',
    isDark: false,
    logoUrl: null,
    mastheadUrl: null,
    displayFont: null,
    bodyFont: null,
    createdAt: new Date('2026-06-09T00:00:00Z'),
    updatedAt: new Date('2026-06-09T00:00:00Z'),
    ...overrides,
  } as ThemeConfig;
}

describe('ThemeCssService (sc-637 follow-on)', () => {
  let service: ThemeCssService;
  let getByDispensaryId: jest.Mock;

  beforeEach(async () => {
    getByDispensaryId = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeCssService,
        { provide: ThemeService, useValue: { getByDispensaryId } },
      ],
    }).compile();
    service = module.get(ThemeCssService);
  });

  it('emits the dispensary header + :root block with all 14 color tokens', async () => {
    getByDispensaryId.mockResolvedValueOnce(row());
    const { css } = await service.generate('disp-1');
    expect(css).toContain('dispensaryId=disp-1');
    expect(css).toContain('--color-primary: #2d6a4f;');
    expect(css).toContain('--color-secondary: #74956c;');
    expect(css).toContain('--color-accent: #c47820;');
    expect(css).toContain('--color-bg: #faf6f0;');
    expect(css).toContain('--color-bg-secondary: #f0ebe3;');
    expect(css).toContain('--color-bg-card: #ffffff;');
    expect(css).toContain('--color-text: #2c2418;');
    expect(css).toContain('--color-text-secondary: #6b5e4f;');
    expect(css).toContain('--color-sidebar-bg: #1b3a2a;');
    expect(css).toContain('--color-sidebar-text: #c8d8c4;');
    expect(css).toContain('--color-success: #27ae60;');
    expect(css).toContain('--color-warning: #d97706;');
    expect(css).toContain('--color-error: #c0392b;');
    expect(css).toContain('--color-info: #2e86ab;');
    expect(css).toContain('--color-scheme: light;');
  });

  it('flips color-scheme to dark when isDark is true', async () => {
    getByDispensaryId.mockResolvedValueOnce(row({ isDark: true }));
    const { css } = await service.generate('disp-1');
    expect(css).toContain('--color-scheme: dark;');
  });

  it('emits @import for each chosen Google Font + font-* tokens', async () => {
    getByDispensaryId.mockResolvedValueOnce(
      row({ displayFont: 'Playfair Display', bodyFont: 'Inter' }),
    );
    const { css } = await service.generate('disp-1');
    expect(css).toContain(
      "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display",
    );
    expect(css).toContain(
      "@import url('https://fonts.googleapis.com/css2?family=Inter",
    );
    expect(css).toContain('--font-display: "Playfair Display", Georgia');
    expect(css).toContain('--font-body: "Inter", system-ui');
  });

  it('dedups @import when display + body fonts share a URL', async () => {
    getByDispensaryId.mockResolvedValueOnce(
      row({
        displayFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans',
      }),
    );
    const { css } = await service.generate('disp-1');
    const imports = (css.match(/@import/g) ?? []).length;
    expect(imports).toBe(1);
  });

  it('ignores fonts not in the curated allowlist', async () => {
    getByDispensaryId.mockResolvedValueOnce(
      row({ displayFont: 'Comic Sans MS' }),
    );
    const { css } = await service.generate('disp-1');
    expect(css).not.toContain('@import');
    expect(css).not.toContain('--font-display');
  });

  it('emits --brand-logo-url and --brand-masthead-url when set', async () => {
    getByDispensaryId.mockResolvedValueOnce(
      row({
        logoUrl: 'http://localhost:3000/uploads/branding/abc_logo.png',
        mastheadUrl: 'http://localhost:3000/uploads/branding/abc_masthead.jpg',
      }),
    );
    const { css } = await service.generate('disp-1');
    expect(css).toContain(
      "--brand-logo-url: url('http://localhost:3000/uploads/branding/abc_logo.png');",
    );
    expect(css).toContain(
      "--brand-masthead-url: url('http://localhost:3000/uploads/branding/abc_masthead.jpg');",
    );
  });

  it('omits brand image declarations when the columns are null', async () => {
    getByDispensaryId.mockResolvedValueOnce(row());
    const { css } = await service.generate('disp-1');
    expect(css).not.toContain('--brand-logo-url');
    expect(css).not.toContain('--brand-masthead-url');
  });

  it('returns the config.updatedAt for ETag building', async () => {
    const when = new Date('2026-06-09T12:34:56Z');
    getByDispensaryId.mockResolvedValueOnce(row({ updatedAt: when }));
    const { updatedAt } = await service.generate('disp-1');
    expect(updatedAt.toISOString()).toBe(when.toISOString());
  });
});
