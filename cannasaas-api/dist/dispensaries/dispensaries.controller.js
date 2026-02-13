"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispensariesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const dispensaries_service_1 = require("./dispensaries.service");
const upload_service_1 = require("../upload/upload.service");
const create_dispensary_dto_1 = require("./dto/create-dispensary.dto");
const update_dispensary_dto_1 = require("./dto/update-dispensary.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_role_enum_1 = require("../users/enums/user-role.enum");
let DispensariesController = class DispensariesController {
    constructor(dispensariesService, uploadService) {
        this.dispensariesService = dispensariesService;
        this.uploadService = uploadService;
    }
    create(createDto) {
        return this.dispensariesService.create(createDto);
    }
    findAll(companyId) {
        return this.dispensariesService.findAll(companyId);
    }
    findNearby(latitude, longitude, radius = 10) {
        return this.dispensariesService.findNearby(latitude, longitude, radius);
    }
    findOne(id) {
        return this.dispensariesService.findOne(id);
    }
    update(id, updateDto) {
        return this.dispensariesService.update(id, updateDto);
    }
    remove(id) {
        return this.dispensariesService.remove(id);
    }
    async uploadLogo(id, file) {
        const logoUrl = await this.uploadService.uploadLogo(file, id);
        return this.dispensariesService.updateBranding(id, { logoUrl });
    }
    updateBranding(id, updateDto) {
        return this.dispensariesService.updateBranding(id, updateDto);
    }
};
exports.DispensariesController = DispensariesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ORG_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dispensary_dto_1.CreateDispensaryDto]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ORG_ADMIN, user_role_enum_1.UserRole.DISPENSARY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dispensary_dto_1.UpdateDispensaryDto]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ORG_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/branding/logo'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ORG_ADMIN, user_role_enum_1.UserRole.DISPENSARY_MANAGER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DispensariesController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Put)(':id/branding'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ORG_ADMIN, user_role_enum_1.UserRole.DISPENSARY_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DispensariesController.prototype, "updateBranding", null);
exports.DispensariesController = DispensariesController = __decorate([
    (0, common_1.Controller)('dispensaries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dispensaries_service_1.DispensariesService,
        upload_service_1.UploadService])
], DispensariesController);
//# sourceMappingURL=dispensaries.controller.js.map