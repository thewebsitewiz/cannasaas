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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyService = exports.LoyaltyTier = void 0;
// cannasaas-api/src/modules/loyalty/loyalty.service.ts
var common_1 = require("@nestjs/common");
var LoyaltyTier;
(function (LoyaltyTier) {
    LoyaltyTier["BRONZE"] = "bronze";
    LoyaltyTier["SILVER"] = "silver";
    LoyaltyTier["GOLD"] = "gold";
    LoyaltyTier["PLATINUM"] = "platinum"; // 5000+ points
})(LoyaltyTier || (exports.LoyaltyTier = LoyaltyTier = {}));
var TIER_CONFIG = (_a = {},
    _a[LoyaltyTier.BRONZE] = { min: 0, earnRate: 1.0, redeemRate: 100, perks: [] },
    _a[LoyaltyTier.SILVER] = { min: 500, earnRate: 1.25, redeemRate: 90,
        perks: ['Free shipping on orders > $50'] },
    _a[LoyaltyTier.GOLD] = { min: 2000, earnRate: 1.5, redeemRate: 80,
        perks: ['Free shipping', 'Early access to new products'] },
    _a[LoyaltyTier.PLATINUM] = { min: 5000, earnRate: 2.0, redeemRate: 70,
        perks: ['Free shipping', 'Early access', 'Exclusive deals', 'Priority support'] },
    _a);
var LoyaltyService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LoyaltyService = _classThis = /** @class */ (function () {
        function LoyaltyService_1(accountRepo, txRepo) {
            this.accountRepo = accountRepo;
            this.txRepo = txRepo;
            this.logger = new common_1.Logger(LoyaltyService.name);
        }
        LoyaltyService_1.prototype.getOrCreateAccount = function (userId, orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var account;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.accountRepo.findOne({
                                where: { userId: userId, organizationId: orgId },
                            })];
                        case 1:
                            account = _a.sent();
                            if (!!account) return [3 /*break*/, 3];
                            account = this.accountRepo.create({
                                userId: userId,
                                organizationId: orgId,
                                balance: 0, lifetimePoints: 0, tier: LoyaltyTier.BRONZE,
                            });
                            return [4 /*yield*/, this.accountRepo.save(account)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, account];
                    }
                });
            });
        };
        LoyaltyService_1.prototype.earnPoints = function (userId, orgId, orderId, amount) {
            return __awaiter(this, void 0, void 0, function () {
                var account, config, points;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateAccount(userId, orgId)];
                        case 1:
                            account = _a.sent();
                            config = TIER_CONFIG[account.tier];
                            points = Math.floor(amount * config.earnRate);
                            account.balance += points;
                            account.lifetimePoints += points;
                            account.tier = this.calculateTier(account.lifetimePoints);
                            return [4 /*yield*/, this.accountRepo.save(account)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.txRepo.save(this.txRepo.create({
                                    accountId: account.id, type: 'earn',
                                    points: points,
                                    orderId: orderId,
                                    description: "Earned ".concat(points, " pts on order"),
                                }))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { pointsEarned: points, newBalance: account.balance, tier: account.tier }];
                    }
                });
            });
        };
        LoyaltyService_1.prototype.redeemPoints = function (userId, orgId, points) {
            return __awaiter(this, void 0, void 0, function () {
                var account, config, discount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateAccount(userId, orgId)];
                        case 1:
                            account = _a.sent();
                            if (account.balance < points) {
                                throw new Error("Insufficient points. Have ".concat(account.balance, ", need ").concat(points));
                            }
                            config = TIER_CONFIG[account.tier];
                            discount = (points / config.redeemRate);
                            account.balance -= points;
                            return [4 /*yield*/, this.accountRepo.save(account)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.txRepo.save(this.txRepo.create({
                                    accountId: account.id, type: 'redeem', points: -points,
                                    description: "Redeemed ".concat(points, " pts for $").concat(discount.toFixed(2), " off"),
                                }))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { pointsRedeemed: points, discountAmount: discount,
                                    remainingBalance: account.balance }];
                    }
                });
            });
        };
        LoyaltyService_1.prototype.calculateTier = function (lifetime) {
            if (lifetime >= 5000)
                return LoyaltyTier.PLATINUM;
            if (lifetime >= 2000)
                return LoyaltyTier.GOLD;
            if (lifetime >= 500)
                return LoyaltyTier.SILVER;
            return LoyaltyTier.BRONZE;
        };
        return LoyaltyService_1;
    }());
    __setFunctionName(_classThis, "LoyaltyService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LoyaltyService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LoyaltyService = _classThis;
}();
exports.LoyaltyService = LoyaltyService;
