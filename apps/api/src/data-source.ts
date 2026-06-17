import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from './common/database/snake-naming.strategy';
import { ALL_ENTITIES } from './entities.index';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Explicit list (tech-debt #11). See `DatabaseModule` for the
  // rationale — the prior glob CJS-required `.entity.ts` files at
  // startup and broke under Vitest.
  entities: ALL_ENTITIES,
  // Migrations stay as a glob: this DataSource is only used by the
  // `pnpm migration:*` CLI scripts (run via ts-node), never during
  // AppModule init, so the glob's load path is fine here.
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
