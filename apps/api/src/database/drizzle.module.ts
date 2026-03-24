import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as relations from './relations';
import { DRIZZLE } from './drizzle.provider';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async () => {
        const pool = new Pool({
          host: process.env['DATABASE_HOST'] || 'localhost',
          port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
          user: process.env['DATABASE_USERNAME'] || 'postgres',
          password: process.env['DATABASE_PASSWORD'] || 'postgres',
          database: process.env['DATABASE_NAME'] || 'cannasaas',
          max: parseInt(process.env['DB_POOL_MAX'] || '20', 10),
          min: parseInt(process.env['DB_POOL_MIN'] || '5', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });
        return drizzle(pool, { schema: { ...schema, ...relations } });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
