import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

// Import new modules
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DispensariesModule } from './dispensaries/dispensaries.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantModule } from './common/tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from './upload/upload.module';
import configuration from './config/aws.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const password = configService.get('database.postgres.password');
        console.log('DB CONFIG:', {
          host: configService.get('database.postgres.host'),
          password: typeof password,
          passwordValue: password, // temporarily log it to debug
        });

        return {
          type: 'postgres',
          host: configService.get('database.postgres.host'),
          port: configService.get('database.postgres.port'),
          database: configService.get('database.postgres.database'),
          username: configService.get('database.postgres.username'),
          password: configService.get('database.postgres.password'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          synchronize: true, // TODO Set to false in production
          logging: true, // configService.get('database.logging'),
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    UploadModule,
    TenantModule,
    TypeOrmModule.forFeature([Tenant]),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('auth');
  }
}
