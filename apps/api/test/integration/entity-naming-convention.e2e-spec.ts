import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

import { AppModule } from '../../src/app.module';

/**
 * Regression guard for tech-debt row 9 (architecture.md §8 / §7 #7).
 *
 * The codified convention is: every column's actual DB identifier
 * (`databaseName`) must equal `snakeCase(propertyName)` — equivalent to
 * what `SnakeNamingStrategy` produces when `name:` is omitted. This
 * holds whether the author wrote `@Column({ name: 'foo_bar' }) fooBar`
 * (explicit) or `@Column() fooBar` (implicit) — only the resolved name
 * matters. The guard fails if anyone:
 *
 *  - Adds an entity field whose strategy-derived snake_case doesn't match
 *    the real column (e.g. abbreviations like `URL` snake_casing weirdly).
 *  - Hand-writes a `name:` that disagrees with the property's snake_case
 *    form, masking a typo as a renamed column.
 *
 * Allowlist: a small set of legitimate exceptions where the DB column
 * really does diverge from the property (legacy renames, embed prefixes
 * we want to preserve, etc.). Keep this list tiny and justify each entry.
 */

interface Violation {
  readonly entity: string;
  readonly property: string;
  readonly expected: string;
  readonly actual: string;
}

const ALLOWLIST: ReadonlyArray<{
  readonly entity: string;
  readonly property: string;
  readonly actual: string;
  readonly reason: string;
}> = [
  // ThemeConfig: DB columns are intentionally `color_*` prefixed to mirror
  // the CSS variable wire format (`--color-success`, etc.). The entity
  // properties stay short because they're also the GraphQL SDL field names
  // (ThemeConfigType / ThemeConfigInput) — renaming would break the admin
  // theme editor's mutation contract. Drift is contained: 4 columns in 1
  // entity, all in `theme-config.entity.ts`.
  {
    entity: 'ThemeConfig',
    property: 'success',
    actual: 'color_success',
    reason: 'GraphQL SDL field stays "success"; DB column matches CSS var naming.',
  },
  {
    entity: 'ThemeConfig',
    property: 'warning',
    actual: 'color_warning',
    reason: 'GraphQL SDL field stays "warning"; DB column matches CSS var naming.',
  },
  {
    entity: 'ThemeConfig',
    property: 'error',
    actual: 'color_error',
    reason: 'GraphQL SDL field stays "error"; DB column matches CSS var naming.',
  },
  {
    entity: 'ThemeConfig',
    property: 'info',
    actual: 'color_info',
    reason: 'GraphQL SDL field stays "info"; DB column matches CSS var naming.',
  },
];

describe('Entity naming convention — column DB names match snakeCase(propertyName) (tech-debt #9)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    ds = app.get<DataSource>(getDataSourceToken());
  }, 30000);

  it('every column has databaseName === snakeCase(propertyName) (or is allowlisted)', () => {
    const violations: Violation[] = [];

    for (const meta of ds.entityMetadatas) {
      for (const col of meta.columns) {
        // Embedded columns get prefix segments joined in `propertyPath`
        // (e.g. `address.street`); snake_case each segment independently
        // and join with `_` so it matches what SnakeNamingStrategy emits.
        const expected = col.propertyPath
          .split('.')
          .map((p) => snakeCase(p))
          .join('_');

        if (col.databaseName === expected) continue;

        const allowed = ALLOWLIST.some(
          (a) =>
            a.entity === meta.targetName &&
            a.property === col.propertyPath &&
            a.actual === col.databaseName,
        );
        if (allowed) continue;

        violations.push({
          entity: meta.targetName,
          property: col.propertyPath,
          expected,
          actual: col.databaseName,
        });
      }
    }

    if (violations.length > 0) {
      const lines = violations
        .map(
          (v) =>
            `  ${v.entity}.${v.property}: expected column "${v.expected}", got "${v.actual}"`,
        )
        .join('\n');
      throw new Error(
        `Entity naming convention violations (${violations.length}):\n${lines}\n\n` +
          `Fix one of:\n` +
          `  - Drop the @Column({ name: '…' }) override so SnakeNamingStrategy picks it up.\n` +
          `  - Rename the property to match the column (or vice-versa via migration).\n` +
          `  - Allowlist the entry in this spec with a written reason if the divergence is intentional.`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
