import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

import { AppModule } from '../../src/app.module';

interface ColumnRow {
  readonly table_name: string;
  readonly column_name: string;
}

/**
 * Regression guard for tech-debt row 3 (architecture.md §8). The
 * `orders`, `order_line_items`, `payments`, `promotions`, and
 * `dispensary_payment_processors` tables originally shipped with
 * quoted-camelCase column identifiers; migration `1778191000000`
 * renamed them to snake_case (and the matching promotions migration
 * `1778191100000` covered the promotion tables). Raw SQL in
 * `orders.service.ts` was fixed in PR #122.
 *
 * This spec queries `information_schema.columns` and fails if any
 * camelCase column re-appears on the five tables — catches both a
 * new entity created without the `name:` mapping AND a hand-written
 * migration that re-introduces the old shape.
 */
describe('DB naming convention — no camelCase columns on legacy tables (tech-debt #3)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    ds = app.get<DataSource>(getDataSourceToken());
  }, 30000);

  const tables = [
    'orders',
    'order_line_items',
    'payments',
    'promotions',
    'promotion_categories',
    'promotion_products',
    'dispensary_payment_processors',
  ] as const;

  it.each(tables)('table `%s` has zero camelCase columns', async (table) => {
    const rows = (await ds.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name ~ '[A-Z]'`,
      [table],
    )) as ColumnRow[];
    if (rows.length > 0) {
      const names = rows.map((r) => r.column_name).join(', ');
      throw new Error(
        `Found camelCase columns on ${table}: ${names}. Add a migration ` +
          `to RENAME them to snake_case + update any raw SQL that referenced them.`,
      );
    }
    expect(rows).toHaveLength(0);
  });
});
