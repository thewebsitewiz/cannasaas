/**
 * Repo-level regression specs for the admin app (sc-530, sc-531).
 *
 * Uses Vite's `import.meta.glob` with `?raw` to slurp all TypeScript
 * source files at bundle time. We restrict to `.ts` because the
 * Angular vitest builder runs CSS imports through the CSS pipeline
 * even with `?raw`, which strips contents.
 */
import { describe, expect, it } from 'vitest';

interface ViteImportMeta {
  glob: (
    pattern: string,
    options: { query?: string; import?: string; eager?: boolean },
  ) => Record<string, unknown>;
}

// All admin TS files (excluding specs themselves).
const adminTsFiles = (import.meta as unknown as ViteImportMeta).glob('../**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('admin regression — TC-REG-001 (sc-530) no Stripe references', () => {
  const STRIPE_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
    { name: '@stripe import', re: /@stripe\b/ },
    { name: 'Stripe( constructor call', re: /\bStripe\s*\(/ },
    { name: 'loadStripe import', re: /\bloadStripe\b/ },
    { name: 'pk_live_ key', re: /\bpk_live_[A-Za-z0-9]+/ },
  ];

  it('no @stripe / Stripe(/loadStripe references in admin TS sources', () => {
    const offenders: { file: string; pattern: string }[] = [];
    for (const [path, text] of Object.entries(adminTsFiles)) {
      if (path.endsWith('regression.spec.ts')) continue;
      for (const { name, re } of STRIPE_PATTERNS) {
        if (re.test(text)) offenders.push({ file: path, pattern: name });
      }
    }
    expect(offenders).toEqual([]);
  });

  it('scan saw a reasonable number of files (sanity check the glob)', () => {
    // If the glob silently returns zero files, the no-Stripe check
    // would vacuously pass. Guard against that.
    expect(Object.keys(adminTsFiles).length).toBeGreaterThan(50);
  });
});

describe('admin regression — TC-REG-002 (sc-531) admin theme is fixed', () => {
  it('admin has no AppThemeService / loadTheme() runtime switcher', () => {
    const offenders: { file: string; match: string }[] = [];
    for (const [path, text] of Object.entries(adminTsFiles)) {
      if (path.endsWith('.spec.ts')) continue;
      if (path.endsWith('regression.spec.ts')) continue;
      // Skip the *editor* — settings/theme/* configures the storefront's
      // theme, not the admin's, so it can legitimately mention theme
      // tokens. The check is for runtime theme-loading wiring.
      if (/\bloadTheme\s*\(/.test(text)) offenders.push({ file: path, match: 'loadTheme()' });
      if (/\bAppThemeService\b/.test(text))
        offenders.push({ file: path, match: 'AppThemeService' });
    }
    expect(offenders).toEqual([]);
  });

  it('no DispensaryContextService-style tenant theming wired into admin bootstrap', () => {
    // The storefront uses DispensaryContextService to resolve per-tenant
    // themes at boot. Admin must not import it.
    const offenders: string[] = [];
    for (const [path, text] of Object.entries(adminTsFiles)) {
      if (path.endsWith('.spec.ts')) continue;
      if (/\bDispensaryContextService\b/.test(text)) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });
});
