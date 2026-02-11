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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceLog = exports.ComplianceEventType = void 0;
const typeorm_1 = require("typeorm");
const dispensary_entity_1 = require("../../dispensaries/entities/dispensary.entity");
var ComplianceEventType;
(function (ComplianceEventType) {
    ComplianceEventType["SALE"] = "sale";
    ComplianceEventType["RETURN"] = "return";
    ComplianceEventType["INVENTORY_ADJUSTMENT"] = "inventory_adjustment";
    ComplianceEventType["INVENTORY_RECEIVED"] = "inventory_received";
    ComplianceEventType["INVENTORY_DESTROYED"] = "inventory_destroyed";
    ComplianceEventType["PRODUCT_RECALL"] = "product_recall";
    ComplianceEventType["ID_VERIFICATION"] = "id_verification";
    ComplianceEventType["PURCHASE_LIMIT_CHECK"] = "purchase_limit_check";
})(ComplianceEventType || (exports.ComplianceEventType = ComplianceEventType = {}));
let ComplianceLog = class ComplianceLog {
};
exports.ComplianceLog = ComplianceLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ComplianceLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dispensary_id', type: 'uuid' }),
    __metadata("design:type", String)
], ComplianceLog.prototype, "dispensaryId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'event_type',
        type: 'enum',
        enum: ComplianceEventType,
    }),
    __metadata("design:type", String)
], ComplianceLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)
], ComplianceLog.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'performed_by', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ComplianceLog.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ComplianceLog.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dispensary_entity_1.Dispensary),
    (0, typeorm_1.JoinColumn)({ name: 'dispensary_id' }),
    __metadata("design:type", dispensary_entity_1.Dispensary)
], ComplianceLog.prototype, "dispensary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], ComplianceLog.prototype, "createdAt", void 0);
exports.ComplianceLog = ComplianceLog = __decorate([
    (0, typeorm_1.Entity)('compliance_logs'),
    (0, typeorm_1.Index)(['dispensaryId', 'createdAt']),
    (0, typeorm_1.Index)(['eventType', 'createdAt'])
], ComplianceLog);
//# sourceMappingURL=compliance-log.entity.js.map