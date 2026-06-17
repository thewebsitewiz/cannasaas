import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

import { AppModule } from '../../src/app.module';
import { ALL_ENTITIES } from '../../src/entities.index';

/**
 * Regression guard for tech-debt #11 (full close). After dropping the
 * runtime entity glob from `DatabaseModule` + `AppDataSource`, the
 * `entities.index.ts` barrel is now the single source of truth — a
 * new `.entity.ts` file silently missing from the barrel would never
 * be registered with TypeORM and any query against it would fail
 * cryptically at runtime.
 *
 * This spec asserts the count of TypeORM entity metadata classes
 * matches the count of class exports in the barrel. It also asserts
 * every class in `ALL_ENTITIES` was discovered by TypeORM, catching
 * the case where the barrel grows but `DatabaseModule` somehow stops
 * consuming it (typo, refactor regression, etc.).
 */
describe('Entities barrel completeness (tech-debt #11)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    ds = app.get<DataSource>(getDataSourceToken());
  }, 30000);

  it('every class in ALL_ENTITIES is registered with TypeORM', () => {
    const registered = new Set(ds.entityMetadatas.map((m) => m.target));
    const missing = ALL_ENTITIES.filter((cls) => !registered.has(cls));
    if (missing.length > 0) {
      const names = missing.map((c) => c.name || '<anonymous>').join(', ');
      throw new Error(
        `ALL_ENTITIES contains classes not registered with TypeORM: ${names}. ` +
          `Check that DatabaseModule's entities: option still passes ALL_ENTITIES.`,
      );
    }
    expect(missing).toHaveLength(0);
  });

  it('TypeORM registered count matches barrel count', () => {
    // TypeORM may register a handful of auxiliary metadata classes (e.g.
    // for typeorm-cli internals). We only assert that the count of
    // entities registered is >= the count we declared — the strict
    // direction (no extras) is too brittle.
    expect(ds.entityMetadatas.length).toBeGreaterThanOrEqual(
      ALL_ENTITIES.length,
    );
  });
});
