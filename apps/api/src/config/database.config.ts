// apps/api/src/config/database.config.ts
import { DataSource } from 'typeorm';

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL environment variable is required');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: true,
  logging:
    process.env['NODE_ENV'] === 'development' ? ['query', 'error'] : ['error'],
  extra: {
    max: parseInt(process.env['DATABASE_POOL_MAX'] ?? '20', 10),
    min: parseInt(process.env['DATABASE_POOL_MIN'] ?? '2', 10),
  },
});

export const databaseConfig = () => ({ url });
