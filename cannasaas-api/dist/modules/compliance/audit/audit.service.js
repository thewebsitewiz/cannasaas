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
exports.AuditService = exports.AuditSeverity = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["ACCESS"] = "access";
    AuditAction["EXPORT"] = "export";
    AuditAction["COMPLIANCE_CHECK"] = "compliance_check";
    AuditAction["INVENTORY_ADJUST"] = "inventory_adjust";
    AuditAction["METRC_SYNC"] = "metrc_sync";
    AuditAction["REFUND"] = "refund";
    AuditAction["VOID"] = "void";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
let AuditService = class AuditService {
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async log(entry) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }))
            .digest('hex');
        return this.auditRepo.save(this.auditRepo.create({
            ...entry, timestamp: new Date(), hash,
        }));
    }
    async getAuditTrail(orgId, filters) {
        const qb = this.auditRepo.createQueryBuilder('audit')
            .where('audit.organizationId = :orgId', { orgId })
            .orderBy('audit.timestamp', 'DESC');
        if (filters.resource)
            qb.andWhere('audit.resource = :r', { r: filters.resource });
        if (filters.userId)
            qb.andWhere('audit.userId = :u', { u: filters.userId });
        if (filters.action)
            qb.andWhere('audit.action = :a', { a: filters.action });
        if (filters.startDate)
            qb.andWhere('audit.timestamp >= :s', { s: filters.startDate });
        if (filters.endDate)
            qb.andWhere('audit.timestamp <= :e', { e: filters.endDate });
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const [logs, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
        return { logs, total, page, totalPages: Math.ceil(total / limit) };
    }
    async exportForRegulator(orgId, startDate, endDate) {
        const logs = await this.auditRepo.find({
            where: { organizationId: orgId, timestamp: (0, typeorm_2.Between)(startDate, endDate) },
            order: { timestamp: 'ASC' },
        });
        const headers = 'Timestamp,User,Action,Resource,ResourceID,Severity,Details\n';
        const rows = logs.map(l => `${l.timestamp.toISOString()},${l.userId},${l.action},${l.resource},${l.resourceId || ''},${l.severity},"${JSON.stringify(l.details).replace(/"/g, '""')}"`).join('\n');
        return headers + rows;
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map