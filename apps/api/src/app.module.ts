import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { configuration } from './config/configuration';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DispensariesModule } from './modules/dispensaries/dispensaries.module';
import { ProductsModule } from './modules/products/products.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ManufacturersModule } from './modules/manufacturers/manufacturers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MetrcModule } from './modules/metrc/metrc.module';
import { ProductDataModule } from './modules/product-data/product-data.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { PosModule } from './modules/pos/pos.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env['REDIS_HOST'] ?? 'localhost',
          port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
        },
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    ProductsModule,
    BrandsModule,
    ManufacturersModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    InventoryModule,
    MetrcModule,
    ProductDataModule,
    AnalyticsModule,
    FulfillmentModule,
    PosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
