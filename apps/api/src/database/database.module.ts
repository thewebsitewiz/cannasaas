// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: true,
        logging: config.get<string>('nodeEnv') === 'development' ? ['query', 'error'] : ['error'],
        extra: {
          max: config.get<number>('database.poolMax') ?? 20,
          min: config.get<number>('database.poolMin') ?? 2,
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
