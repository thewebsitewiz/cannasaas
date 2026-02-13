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
exports.FeatureFlagService = void 0;
// cannasaas-api/src/modules/feature-flags/feature-flag.service.ts
var common_1 = require("@nestjs/common");
var feature_flag_entity_1 = require("./entities/feature-flag.entity");
var FeatureFlagService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FeatureFlagService = _classThis = /** @class */ (function () {
        function FeatureFlagService_1(flagRepo, cache) {
            this.flagRepo = flagRepo;
            this.cache = cache;
            this.TTL = 300; // 5 minutes
        }
        FeatureFlagService_1.prototype.isEnabled = function (orgId, feature) {
            return __awaiter(this, void 0, void 0, function () {
                var cacheKey, cached, flag, enabled;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            cacheKey = "ff:".concat(orgId, ":").concat(feature);
                            return [4 /*yield*/, this.cache.get(cacheKey)];
                        case 1:
                            cached = _c.sent();
                            if (cached !== undefined && cached !== null)
                                return [2 /*return*/, cached];
                            return [4 /*yield*/, this.flagRepo.findOne({
                                    where: { organizationId: orgId },
                                })];
                        case 2:
                            flag = _c.sent();
                            if (!flag)
                                return [2 /*return*/, false];
                            if (!(flag.overrides[feature] !== undefined)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.cache.set(cacheKey, flag.overrides[feature], this.TTL)];
                        case 3:
                            _c.sent();
                            return [2 /*return*/, flag.overrides[feature]];
                        case 4:
                            enabled = (_b = (_a = feature_flag_entity_1.PLAN_FEATURES[flag.plan]) === null || _a === void 0 ? void 0 : _a.includes(feature)) !== null && _b !== void 0 ? _b : false;
                            return [4 /*yield*/, this.cache.set(cacheKey, enabled, this.TTL)];
                        case 5:
                            _c.sent();
                            return [2 /*return*/, enabled];
                    }
                });
            });
        };
        FeatureFlagService_1.prototype.getAllFlags = function (orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var flag, result, _i, _a, f;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, this.flagRepo.findOne({
                                where: { organizationId: orgId },
                            })];
                        case 1:
                            flag = _d.sent();
                            result = {};
                            for (_i = 0, _a = Object.values(feature_flag_entity_1.Feature); _i < _a.length; _i++) {
                                f = _a[_i];
                                if ((flag === null || flag === void 0 ? void 0 : flag.overrides[f]) !== undefined) {
                                    result[f] = flag.overrides[f];
                                }
                                else {
                                    result[f] = (_c = (_b = feature_flag_entity_1.PLAN_FEATURES[flag === null || flag === void 0 ? void 0 : flag.plan]) === null || _b === void 0 ? void 0 : _b.includes(f)) !== null && _c !== void 0 ? _c : false;
                                }
                            }
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        FeatureFlagService_1.prototype.setOverride = function (orgId, feature, enabled) {
            return __awaiter(this, void 0, void 0, function () {
                var flag;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.flagRepo.findOneOrFail({
                                where: { organizationId: orgId },
                            })];
                        case 1:
                            flag = _b.sent();
                            flag.overrides = __assign(__assign({}, flag.overrides), (_a = {}, _a[feature] = enabled, _a));
                            return [4 /*yield*/, this.flagRepo.save(flag)];
                        case 2:
                            _b.sent();
                            return [4 /*yield*/, this.cache.del("ff:".concat(orgId, ":").concat(feature))];
                        case 3:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        FeatureFlagService_1.prototype.invalidateCache = function (orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, _a, f;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _i = 0, _a = Object.values(feature_flag_entity_1.Feature);
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3 /*break*/, 4];
                            f = _a[_i];
                            return [4 /*yield*/, this.cache.del("ff:".concat(orgId, ":").concat(f))];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return FeatureFlagService_1;
    }());
    __setFunctionName(_classThis, "FeatureFlagService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FeatureFlagService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FeatureFlagService = _classThis;
}();
exports.FeatureFlagService = FeatureFlagService;
