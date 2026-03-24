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
    process.env['NODE_ENV'] !== 'production' ? ['query', 'error'] : ['error', 'warn'],
  maxQueryExecutionTime: 1000, // Log queries slower than 1 second
  extra: {
    max: parseInt(process.env['DB_POOL_MAX'] ?? '20', 10),
    min: parseInt(process.env['DB_POOL_MIN'] ?? '5', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});

export const databaseConfig = () => ({ url });
