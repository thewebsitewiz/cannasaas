"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const companies_module_1 = require("./companies/companies.module");
const compliance_module_1 = require("./compliance/compliance.module");
const dispensaries_module_1 = require("./dispensaries/dispensaries.module");
const orders_module_1 = require("./orders/orders.module");
const organizations_module_1 = require("./organizations/organizations.module");
const products_module_1 = require("./products/products.module");
const tenant_entity_1 = require("./tenants/entities/tenant.entity");
const tenant_middleware_1 = require("./common/middleware/tenant.middleware");
const tenant_module_1 = require("./common/tenant/tenant.module");
const typeorm_1 = require("@nestjs/typeorm");
const upload_module_1 = require("./upload/upload.module");
const aws_config_1 = require("./config/aws.config");
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('auth');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [aws_config_1.default, database_config_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.postgres.host'),
                    port: configService.get('database.postgres.port'),
                    username: configService.get('database.postgres.username'),
                    password: configService.get('database.postgres.password'),
                    database: configService.get('database.postgres.database'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    migrations: [__dirname + '/migrations/*{.ts,.js}'],
                    synchronize: false,
                    autoLoadEntities: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([tenant_entity_1.Tenant]),
            tenant_module_1.TenantModule,
            auth_module_1.AuthModule,
            organizations_module_1.OrganizationsModule,
            companies_module_1.CompaniesModule,
            dispensaries_module_1.DispensariesModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            compliance_module_1.ComplianceModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map