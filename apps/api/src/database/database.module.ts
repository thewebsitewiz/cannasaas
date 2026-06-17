import { ConfigService } from '@nestjs/config';
// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from '../common/database/snake-naming.strategy';
import { ALL_ENTITIES } from '../entities.index';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('database.url'),
        // Explicit entity list (tech-debt #11 close). The prior runtime
        // glob `__dirname + '/../**/*.entity{.ts,.js}'` forced TypeORM
        // to CJS-`require()` `.entity.ts` files at startup, which works
        // under ts-jest but trips Vitest's loader. `ALL_ENTITIES` is
        // the same set, gathered statically via barrel imports.
        entities: ALL_ENTITIES,
        // No `migrations:` here. The runtime app never runs migrations
        // — that's the job of `pnpm migration:run`, which loads them
        // via `data-source.ts`. Listing them here only forced TypeORM
        // to CJS-`require()` migration TS files at app boot for
        // metadata it never uses, which also broke under Vitest.
        namingStrategy: new SnakeNamingStrategy(),
        // synchronize: false — schema is owned by migrations, never by
        // entity diffing. Auto-sync was previously enabled in dev which
        // risks dropping columns the entity layer doesn't know about.
        synchronize: false,
        logging:
          config.get<string>('nodeEnv') !== 'production'
            ? ['query', 'error']
            : ['error', 'warn'],
        maxQueryExecutionTime: 1000, // Log queries slower than 1 second
        extra: {
          max: parseInt(process.env['DB_POOL_MAX'] || '20', 10),
          min: parseInt(process.env['DB_POOL_MIN'] || '5', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
