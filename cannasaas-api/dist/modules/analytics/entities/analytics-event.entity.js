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
exports.AnalyticsEvent = void 0;
const typeorm_1 = require("typeorm");
let AnalyticsEvent = class AnalyticsEvent {
};
exports.AnalyticsEvent = AnalyticsEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AnalyticsEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], AnalyticsEvent.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', length: 50 }),
    __metadata("design:type", String)
], AnalyticsEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AnalyticsEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', length: 100 }),
    __metadata("design:type", String)
], AnalyticsEvent.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AnalyticsEvent.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AnalyticsEvent.prototype, "timestamp", void 0);
exports.AnalyticsEvent = AnalyticsEvent = __decorate([
    (0, typeorm_1.Entity)('analytics_events'),
    (0, typeorm_1.Index)(['organizationId', 'timestamp']),
    (0, typeorm_1.Index)(['organizationId', 'eventType'])
], AnalyticsEvent);
//# sourceMappingURL=analytics-event.entity.js.map