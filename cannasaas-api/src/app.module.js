"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var config_1 = require("@nestjs/config");
var common_1 = require("@nestjs/common");
var auth_module_1 = require("./auth/auth.module");
var companies_module_1 = require("./companies/companies.module");
var compliance_module_1 = require("./compliance/compliance.module");
var dispensaries_module_1 = require("./dispensaries/dispensaries.module");
var orders_module_1 = require("./orders/orders.module");
var organizations_module_1 = require("./organizations/organizations.module");
var products_module_1 = require("./products/products.module");
var tenant_entity_1 = require("./tenants/entities/tenant.entity");
var tenant_middleware_1 = require("./common/middleware/tenant.middleware");
var tenant_module_1 = require("./common/tenant/tenant.module");
var typeorm_1 = require("@nestjs/typeorm");
var upload_module_1 = require("./upload/upload.module");
var aws_config_1 = require("./config/aws.config");
var database_config_1 = require("./config/database.config");
var AppModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [aws_config_1.default, database_config_1.default],
                }),
                typeorm_1.TypeOrmModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: function (configService) { return ({
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
                    }); },
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
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        AppModule_1.prototype.configure = function (consumer) {
            consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('auth');
        };
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
