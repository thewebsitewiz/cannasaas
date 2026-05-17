import { ConfigService } from '@nestjs/config';
// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from '../common/database/snake-naming.strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
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
