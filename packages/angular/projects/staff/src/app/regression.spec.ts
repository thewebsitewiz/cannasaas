/**
 * Repo-level regression specs for the staff app (sc-566..569).
 *
 * Walks staff TS source files via Vite `import.meta.glob('?raw')`
 * and asserts Angular 21 conventions hold. Same approach as the
 * admin app's regression.spec.ts.
 *
 * sc-570 (TC-REG-105 — `ng build staff` clean) is enforced by CI
 * (every PR runs the production build) rather than this spec.
 */
import { describe, expect, it } from 'vitest';

interface ViteImportMeta {
  glob: (
    pattern: string,
    options: { query?: string; import?: string; eager?: boolean },
  ) => Record<string, unknown>;
}

const staffTsFiles = (import.meta as unknown as ViteImportMeta).glob('../**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Source files only — exclude tests, this spec, and entry shims. */
const sourceFiles = Object.entries(staffTsFiles).filter(([path]) => {
  if (path.endsWith('.spec.ts')) return false;
  if (path.endsWith('regression.spec.ts')) return false;
  return true;
});

describe('staff regression — sanity check', () => {
  it('the glob picked up a reasonable number of source files', () => {
    // Guard against silently empty scans that would vacuously pass
    // every other test in this file.
    expect(sourceFiles.length).toBeGreaterThan(10);
  });
});

describe('staff regression — TC-REG-101 (sc-566) no legacy structural directives', () => {
  // Look at component templates (`.ts` files with @Component({ template: `…` })).
  // Reject the *ngIf / *ngFor / *ngSwitch shorthand — modern @if / @for / @switch
  // control flow is mandatory per root CLAUDE.md.
  const LEGACY = [
    { name: '*ngIf', re: /\*ngIf\b/ },
    { name: '*ngFor', re: /\*ngFor\b/ },
    { name: '*ngSwitch', re: /\*ngSwitch\b/ },
    { name: '*ngSwitchCase', re: /\*ngSwitchCase\b/ },
    { name: '*ngSwitchDefault', re: /\*ngSwitchDefault\b/ },
  ];

  it('no *ngIf / *ngFor / *ngSwitch in staff sources', () => {
    const offenders: { file: string; pattern: string }[] = [];
    for (const [path, text] of sourceFiles) {
      for (const { name, re } of LEGACY) {
        if (re.test(text)) offenders.push({ file: path, pattern: name });
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('staff regression — TC-REG-102 (sc-567) every component is OnPush', () => {
  // Find every `@Component({` block and assert it sets
  // `changeDetection: ChangeDetectionStrategy.OnPush`. Plain text
  // scan keeps the check fast and free of TS-AST machinery.
  it('every @Component declares ChangeDetectionStrategy.OnPush', () => {
    const offenders: string[] = [];
    for (const [path, text] of sourceFiles) {
      // Lazy: find each @Component( … ) block and inspect its body.
      const matches = text.matchAll(/@Component\s*\(\s*\{([\s\S]*?)\}\s*\)/g);
      for (const m of matches) {
        const body = m[1];
        if (!/changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(body)) {
          offenders.push(path);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('staff regression — TC-REG-103 (sc-568) no BehaviorSubject for component state', () => {
  // BehaviorSubject is allowed in narrow framework-glue cases but not for
  // app state — root CLAUDE.md mandates signals for state. We scan the
  // *imports* + usages and reject anything that looks like a component
  // state container.
  it('no BehaviorSubject<…> declarations in staff sources', () => {
    const offenders: string[] = [];
    for (const [path, text] of sourceFiles) {
      if (/\bnew\s+BehaviorSubject\s*</.test(text)) offenders.push(path);
      if (/:\s*BehaviorSubject\s*</.test(text)) offenders.push(path);
    }
    // De-dup so the failure is one entry per file.
    expect([...new Set(offenders)]).toEqual([]);
  });
});

describe('staff regression — TC-REG-104 (sc-569) inject() everywhere; no constructor params', () => {
  // Reject constructors that look like classic DI:
  //   constructor(private foo: Foo) {}
  //   constructor(readonly foo: Foo) {}
  //   constructor(@Inject(TOKEN) foo: unknown) {}
  // Allow `constructor() {…}` — paramless is the only acceptable shape.
  const PARAM_DI_RE =
    /constructor\s*\([^)]*(?:private\s+\w+|public\s+\w+|protected\s+\w+|readonly\s+\w+|@Inject\b)/;

  it('no constructor-parameter DI in staff sources', () => {
    const offenders: string[] = [];
    for (const [path, text] of sourceFiles) {
      if (PARAM_DI_RE.test(text)) offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });
});
