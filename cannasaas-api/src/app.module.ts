import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ComplianceModule } from './compliance/compliance.module';
import { DispensariesModule } from './dispensaries/dispensaries.module';
import { OrdersModule } from './orders/orders.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProductsModule } from './products/products.module';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantsModule } from './tenants/tenants.module';
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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.postgres.host'),
        port: configService.get('database.postgres.port'),
        username: configService.get('database.postgres.username'),
        password: configService.get('database.postgres.password'),
        database: configService.get('database.postgres.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false, // Use migrations in production
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Tenant]),
    TenantModule,
    AuthModule,
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    ProductsModule,
    OrdersModule,
    ComplianceModule,
    UploadModule,
    TenantsModule,
  ],
})
/* export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('auth');
  }
} */
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('tenants/public') // <-- Add this exclusion
      .forRoutes('*'); // <-- Apply to all other routes
  }
}
