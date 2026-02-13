"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.CampaignService = void 0;
// cannasaas-api/src/modules/marketing/campaign.service.ts
var common_1 = require("@nestjs/common");
var schedule_1 = require("@nestjs/schedule");
var typeorm_1 = require("typeorm");
var CampaignService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _processAbandonedCarts_decorators;
    var _processWelcomeSeries_decorators;
    var _processWinBack_decorators;
    var CampaignService = _classThis = /** @class */ (function () {
        function CampaignService_1(cartRepo, userRepo, logRepo, mail) {
            this.cartRepo = (__runInitializers(this, _instanceExtraInitializers), cartRepo);
            this.userRepo = userRepo;
            this.logRepo = logRepo;
            this.mail = mail;
            this.logger = new common_1.Logger(CampaignService.name);
        }
        // Abandoned Cart Recovery - every 30 minutes
        CampaignService_1.prototype.processAbandonedCarts = function () {
            return __awaiter(this, void 0, void 0, function () {
                var oneHourAgo, oneDayAgo, carts, _i, carts_1, cart, recent;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                            oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                            return [4 /*yield*/, this.cartRepo.find({
                                    where: { updatedAt: (0, typeorm_1.LessThan)(oneHourAgo), checkedOut: false },
                                    relations: ['user'],
                                })];
                        case 1:
                            carts = _b.sent();
                            _i = 0, carts_1 = carts;
                            _b.label = 2;
                        case 2:
                            if (!(_i < carts_1.length)) return [3 /*break*/, 7];
                            cart = carts_1[_i];
                            if (!((_a = cart.user) === null || _a === void 0 ? void 0 : _a.email))
                                return [3 /*break*/, 6];
                            return [4 /*yield*/, this.logRepo.findOne({
                                    where: { userId: cart.userId, campaignType: 'abandoned_cart',
                                        sentAt: (0, typeorm_1.MoreThan)(oneDayAgo) },
                                })];
                        case 3:
                            recent = _b.sent();
                            if (recent)
                                return [3 /*break*/, 6];
                            return [4 /*yield*/, this.mail.sendAbandonedCartEmail({
                                    to: cart.user.email, firstName: cart.user.firstName,
                                    cartItems: cart.items, cartTotal: cart.total,
                                    recoveryUrl: "/cart?recover=".concat(cart.id),
                                    couponCode: 'COMEBACK10',
                                })];
                        case 4:
                            _b.sent();
                            return [4 /*yield*/, this.logRepo.save(this.logRepo.create({
                                    userId: cart.userId, campaignType: 'abandoned_cart',
                                    sentAt: new Date(), channel: 'email',
                                }))];
                        case 5:
                            _b.sent();
                            _b.label = 6;
                        case 6:
                            _i++;
                            return [3 /*break*/, 2];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        // Welcome Drip - every hour
        CampaignService_1.prototype.processWelcomeSeries = function () {
            return __awaiter(this, void 0, void 0, function () {
                var steps, _i, steps_1, step, target, dayStart, dayEnd, users, _a, users_1, user, sent;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            steps = [
                                { day: 0, template: 'welcome_1', subject: 'Welcome to {{store}}!' },
                                { day: 2, template: 'welcome_2', subject: 'Discover our top products' },
                                { day: 5, template: 'welcome_3', subject: 'Join our loyalty program' },
                                { day: 10, template: 'welcome_4', subject: 'Your first-time discount' },
                            ];
                            _i = 0, steps_1 = steps;
                            _b.label = 1;
                        case 1:
                            if (!(_i < steps_1.length)) return [3 /*break*/, 9];
                            step = steps_1[_i];
                            target = new Date(Date.now() - step.day * 86400000);
                            dayStart = new Date(target);
                            dayStart.setHours(0, 0, 0, 0);
                            dayEnd = new Date(target);
                            dayEnd.setHours(23, 59, 59, 999);
                            return [4 /*yield*/, this.userRepo.find({
                                    where: { createdAt: (0, typeorm_1.Between)(dayStart, dayEnd) },
                                })];
                        case 2:
                            users = _b.sent();
                            _a = 0, users_1 = users;
                            _b.label = 3;
                        case 3:
                            if (!(_a < users_1.length)) return [3 /*break*/, 8];
                            user = users_1[_a];
                            return [4 /*yield*/, this.logRepo.findOne({
                                    where: { userId: user.id, campaignType: "welcome_".concat(step.day) },
                                })];
                        case 4:
                            sent = _b.sent();
                            if (sent)
                                return [3 /*break*/, 7];
                            return [4 /*yield*/, this.mail.sendTemplateEmail({
                                    to: user.email, template: step.template,
                                    subject: step.subject, data: { firstName: user.firstName },
                                })];
                        case 5:
                            _b.sent();
                            return [4 /*yield*/, this.logRepo.save(this.logRepo.create({
                                    userId: user.id, campaignType: "welcome_".concat(step.day),
                                    sentAt: new Date(), channel: 'email',
                                }))];
                        case 6:
                            _b.sent();
                            _b.label = 7;
                        case 7:
                            _a++;
                            return [3 /*break*/, 3];
                        case 8:
                            _i++;
                            return [3 /*break*/, 1];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        // Win-Back - daily at 9 AM
        CampaignService_1.prototype.processWinBack = function () {
            return __awaiter(this, void 0, void 0, function () {
                var thirtyDaysAgo, sevenDaysAgo, inactive, _i, inactive_1, user, recent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
                            sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
                            return [4 /*yield*/, this.userRepo.createQueryBuilder('user')
                                    .where('user.lastOrderDate < :date', { date: thirtyDaysAgo })
                                    .andWhere('user.emailOptIn = true').getMany()];
                        case 1:
                            inactive = _a.sent();
                            _i = 0, inactive_1 = inactive;
                            _a.label = 2;
                        case 2:
                            if (!(_i < inactive_1.length)) return [3 /*break*/, 7];
                            user = inactive_1[_i];
                            return [4 /*yield*/, this.logRepo.findOne({
                                    where: { userId: user.id, campaignType: 'win_back',
                                        sentAt: (0, typeorm_1.MoreThan)(sevenDaysAgo) },
                                })];
                        case 3:
                            recent = _a.sent();
                            if (recent)
                                return [3 /*break*/, 6];
                            return [4 /*yield*/, this.mail.sendWinBackEmail({
                                    to: user.email, firstName: user.firstName,
                                    couponCode: 'MISSYOU15', discountPercent: 15,
                                })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.logRepo.save(this.logRepo.create({
                                    userId: user.id, campaignType: 'win_back',
                                    sentAt: new Date(), channel: 'email',
                                }))];
                        case 5:
                            _a.sent();
                            _a.label = 6;
                        case 6:
                            _i++;
                            return [3 /*break*/, 2];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        return CampaignService_1;
    }());
    __setFunctionName(_classThis, "CampaignService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _processAbandonedCarts_decorators = [(0, schedule_1.Cron)('*/30 * * * *')];
        _processWelcomeSeries_decorators = [(0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR)];
        _processWinBack_decorators = [(0, schedule_1.Cron)('0 9 * * *')];
        __esDecorate(_classThis, null, _processAbandonedCarts_decorators, { kind: "method", name: "processAbandonedCarts", static: false, private: false, access: { has: function (obj) { return "processAbandonedCarts" in obj; }, get: function (obj) { return obj.processAbandonedCarts; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _processWelcomeSeries_decorators, { kind: "method", name: "processWelcomeSeries", static: false, private: false, access: { has: function (obj) { return "processWelcomeSeries" in obj; }, get: function (obj) { return obj.processWelcomeSeries; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _processWinBack_decorators, { kind: "method", name: "processWinBack", static: false, private: false, access: { has: function (obj) { return "processWinBack" in obj; }, get: function (obj) { return obj.processWinBack; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CampaignService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CampaignService = _classThis;
}();
exports.CampaignService = CampaignService;
