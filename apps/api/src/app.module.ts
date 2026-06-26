import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { configuration } from './config/configuration';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { depthLimitPlugin } from './common/plugins/depth-limit.plugin';
import { complexityLimitPlugin } from './common/plugins/complexity-limit.plugin';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { KioskAttestationGuard } from './modules/auth/guards/kiosk-attestation.guard';
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
import { StaffingModule } from './modules/staffing/staffing.module';
import { TimeClockModule } from './modules/timeclock/timeclock.module';
import { InventoryControlModule } from './modules/inventory-control/inventory-control.module';
import { CustomerModule } from './modules/customers/customer.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { WsModule } from './modules/ws/ws.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MetrcModule } from './modules/metrc/metrc.module';
import { ProductDataModule } from './modules/product-data/product-data.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { PosModule } from './modules/pos/pos.module';

import { ImageModule } from './modules/image/image.module';
import { PlatformModule } from './modules/platform/platform.module';
import { ThemeModule } from './modules/theme/theme.module';
import { HealthModule } from './modules/health/health.module';
import { RecommendationModule } from './modules/recommendations/recommendation.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { SearchModule } from './modules/search/search.module';
import { RegisterSessionsModule } from './modules/register-sessions/register-sessions.module';
import { BiotrackModule } from './modules/biotrack/biotrack.module';
import { IdVerificationModule } from './modules/verification/id-verification.module';
import { CacheModule } from './common/services/cache.module';
import { DispensaryOwnershipModule } from './common/services/dispensary-ownership.module';
import { SentryModule } from './common/services/sentry.module';
import { MetricsModule } from './common/services/metrics.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { join } from 'path';

@Module({
  imports: [
    SentryModule,
    MetricsModule,
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
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true, // optional, makes diffs cleaner
      playground: process.env['NODE_ENV'] !== 'production',
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      plugins: [depthLimitPlugin, complexityLimitPlugin],
    }),

    // Foundations — shared infra that downstream features depend on.
    CacheModule,
    DispensaryOwnershipModule,
    DatabaseModule,

    // Identity + tenancy hierarchy (organizations → companies → dispensaries).
    AuthModule,
    UsersModule,
    OrganizationsModule,
    CompaniesModule,
    DispensariesModule,
    PlatformModule,
    RegisterSessionsModule,

    // Catalog: what the dispensary sells.
    ProductsModule,
    BrandsModule,
    ManufacturersModule,
    ProductDataModule,
    PromotionsModule,
    InventoryModule,
    InventoryControlModule,
    SearchModule,
    RecommendationModule,

    // Customer-facing identity + experience.
    CustomerModule,
    IdVerificationModule,
    MarketingModule,
    ThemeModule,

    // Order pipeline — checkout, payment, fulfillment, in-store POS.
    OrdersModule,
    PaymentsModule,
    FulfillmentModule,
    PosModule,

    // Compliance + regulator integrations.
    ComplianceModule,
    MetrcModule,
    BiotrackModule,

    // Workforce.
    StaffingModule,
    TimeClockModule,
    SchedulingModule,

    // Cross-cutting surfaces: notifications, analytics, vendor pipeline,
    // realtime, image handling, knowledge base, ops health.
    NotificationModule,
    AnalyticsModule,
    ReportingModule,
    ImageModule,
    KnowledgeModule,
    WsModule,
    WebhooksModule,
    HealthModule,
  ],
  providers: [
    // Filter + interceptor wired through DI so their @Optional() Sentry +
    // Metrics injections actually resolve (instead of always being undefined
    // when instantiated via bare `new` in main.ts).
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Rate limit BEFORE auth so we drop floods without doing any JWT work.
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: KioskAttestationGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
