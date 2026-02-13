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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const audit_service_1 = require("../../modules/compliance/audit/audit.service");
let AuditInterceptor = class AuditInterceptor {
    constructor(audit) {
        this.audit = audit;
    }
    intercept(ctx, next) {
        const request = ctx.switchToHttp().getRequest();
        const method = request.method;
        let action = audit_service_1.AuditAction.ACCESS;
        if (method === 'POST')
            action = audit_service_1.AuditAction.CREATE;
        if (method === 'PUT' || method === 'PATCH')
            action = audit_service_1.AuditAction.UPDATE;
        if (method === 'DELETE')
            action = audit_service_1.AuditAction.DELETE;
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            this.audit.log({
                organizationId: request['organizationId'],
                userId: request.user?.id || 'anonymous',
                action,
                resource: ctx.getClass().name.replace('Controller', '').toLowerCase(),
                resourceId: request.params.id,
                severity: method === 'DELETE' ? audit_service_1.AuditSeverity.HIGH : audit_service_1.AuditSeverity.LOW,
                details: { method, url: request.originalUrl,
                    body: method !== 'GET' ? request.body : undefined },
                ipAddress: request.ip,
            });
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map