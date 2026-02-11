"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensariesModule = void 0;
const auth_module_1 = require("../auth/auth.module");
const branding_config_entity_1 = require("./entities/branding-config.entity");
const dispensaries_controller_1 = require("./dispensaries.controller");
const dispensaries_service_1 = require("./dispensaries.service");
const dispensary_entity_1 = require("./entities/dispensary.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const upload_module_1 = require("../upload/upload.module");
let DispensariesModule = class DispensariesModule {
};
exports.DispensariesModule = DispensariesModule;
exports.DispensariesModule = DispensariesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([dispensary_entity_1.Dispensary, branding_config_entity_1.BrandingConfig]),
            upload_module_1.UploadModule,
            auth_module_1.AuthModule,
        ],
        controllers: [dispensaries_controller_1.DispensariesController],
        providers: [dispensaries_service_1.DispensariesService],
        exports: [dispensaries_service_1.DispensariesService],
    })
], DispensariesModule);
//# sourceMappingURL=dispensaries.module.js.map