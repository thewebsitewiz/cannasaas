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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const api_key_service_1 = require("../../modules/api-keys/api-key.service");
const core_1 = require("@nestjs/core");
let ApiKeyGuard = class ApiKeyGuard {
    constructor(apiKeyService, reflector) {
        this.apiKeyService = apiKeyService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader?.startsWith('Bearer cs_'))
            return false;
        const rawKey = authHeader.replace('Bearer ', '');
        const apiKey = await this.apiKeyService.validateKey(rawKey);
        const requiredPermission = this.reflector.get('api_permission', context.getHandler());
        if (requiredPermission && !apiKey.permissions.includes(requiredPermission))
            return false;
        request['organizationId'] = apiKey.organizationId;
        request['apiKey'] = apiKey;
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService,
        core_1.Reflector])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map