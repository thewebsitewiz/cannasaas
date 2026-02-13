"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = exports.AuditSeverity = exports.AuditAction = void 0;
// cannasaas-api/src/modules/compliance/audit/audit.service.ts
var common_1 = require("@nestjs/common");
var typeorm_1 = require("typeorm");
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
var AuditService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuditService = _classThis = /** @class */ (function () {
        function AuditService_1(auditRepo) {
            this.auditRepo = auditRepo;
        }
        AuditService_1.prototype.log = function (entry) {
            return __awaiter(this, void 0, void 0, function () {
                var crypto, hash;
                return __generator(this, function (_a) {
                    crypto = require('crypto');
                    hash = crypto.createHash('sha256')
                        .update(JSON.stringify(__assign(__assign({}, entry), { timestamp: new Date().toISOString() })))
                        .digest('hex');
                    return [2 /*return*/, this.auditRepo.save(this.auditRepo.create(__assign(__assign({}, entry), { timestamp: new Date(), hash: hash })))];
                });
            });
        };
        AuditService_1.prototype.getAuditTrail = function (orgId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var qb, page, limit, _a, logs, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            qb = this.auditRepo.createQueryBuilder('audit')
                                .where('audit.organizationId = :orgId', { orgId: orgId })
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
                            page = filters.page || 1;
                            limit = filters.limit || 50;
                            return [4 /*yield*/, qb.skip((page - 1) * limit).take(limit).getManyAndCount()];
                        case 1:
                            _a = _b.sent(), logs = _a[0], total = _a[1];
                            return [2 /*return*/, { logs: logs, total: total, page: page, totalPages: Math.ceil(total / limit) }];
                    }
                });
            });
        };
        AuditService_1.prototype.exportForRegulator = function (orgId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                var logs, headers, rows;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.auditRepo.find({
                                where: { organizationId: orgId, timestamp: (0, typeorm_1.Between)(startDate, endDate) },
                                order: { timestamp: 'ASC' },
                            })];
                        case 1:
                            logs = _a.sent();
                            headers = 'Timestamp,User,Action,Resource,ResourceID,Severity,Details\n';
                            rows = logs.map(function (l) {
                                return "".concat(l.timestamp.toISOString(), ",").concat(l.userId, ",").concat(l.action, ",").concat(l.resource, ",").concat(l.resourceId || '', ",").concat(l.severity, ",\"").concat(JSON.stringify(l.details).replace(/"/g, '""'), "\"");
                            }).join('\n');
                            return [2 /*return*/, headers + rows];
                    }
                });
            });
        };
        return AuditService_1;
    }());
    __setFunctionName(_classThis, "AuditService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditService = _classThis;
}();
exports.AuditService = AuditService;
