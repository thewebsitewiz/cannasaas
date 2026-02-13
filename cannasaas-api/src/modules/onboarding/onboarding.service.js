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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = exports.OnboardingStep = void 0;
// cannasaas-api/src/modules/onboarding/onboarding.service.ts
var common_1 = require("@nestjs/common");
var OnboardingStep;
(function (OnboardingStep) {
    OnboardingStep["BUSINESS_INFO"] = "business_info";
    OnboardingStep["BRANDING"] = "branding";
    OnboardingStep["LOCATIONS"] = "locations";
    OnboardingStep["PAYMENT_PROCESSING"] = "payment_processing";
    OnboardingStep["FIRST_PRODUCTS"] = "first_products";
    OnboardingStep["STAFF_INVITE"] = "staff_invite";
    OnboardingStep["COMPLIANCE"] = "compliance";
    OnboardingStep["REVIEW_LAUNCH"] = "review_launch";
})(OnboardingStep || (exports.OnboardingStep = OnboardingStep = {}));
var STEP_ORDER = Object.values(OnboardingStep);
var OnboardingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OnboardingService = _classThis = /** @class */ (function () {
        function OnboardingService_1(orgRepo, stripe, mail) {
            this.orgRepo = orgRepo;
            this.stripe = stripe;
            this.mail = mail;
        }
        OnboardingService_1.prototype.getStatus = function (orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var org;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.orgRepo.findOneOrFail({ where: { id: orgId } })];
                        case 1:
                            org = _b.sent();
                            return [2 /*return*/, {
                                    currentStep: org.onboardingStep || OnboardingStep.BUSINESS_INFO,
                                    completedSteps: org.completedSteps || [],
                                    progress: ((((_a = org.completedSteps) === null || _a === void 0 ? void 0 : _a.length) || 0) / STEP_ORDER.length) * 100,
                                }];
                    }
                });
            });
        };
        OnboardingService_1.prototype.processStep = function (orgId, step, data) {
            return __awaiter(this, void 0, void 0, function () {
                var org, _a, account, _i, _b, email, idx;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.orgRepo.findOneOrFail({ where: { id: orgId } })];
                        case 1:
                            org = _f.sent();
                            _a = step;
                            switch (_a) {
                                case OnboardingStep.BUSINESS_INFO: return [3 /*break*/, 2];
                                case OnboardingStep.BRANDING: return [3 /*break*/, 3];
                                case OnboardingStep.PAYMENT_PROCESSING: return [3 /*break*/, 4];
                                case OnboardingStep.STAFF_INVITE: return [3 /*break*/, 6];
                                case OnboardingStep.COMPLIANCE: return [3 /*break*/, 11];
                            }
                            return [3 /*break*/, 12];
                        case 2:
                            org.name = data.businessName;
                            org.legalName = data.legalName;
                            org.licenseNumber = data.licenseNumber;
                            org.licenseType = data.licenseType;
                            org.contactEmail = data.email;
                            org.contactPhone = data.phone;
                            org.slug = this.generateSlug(data.businessName);
                            return [3 /*break*/, 12];
                        case 3:
                            org.branding = {
                                primaryColor: data.primaryColor,
                                secondaryColor: data.secondaryColor,
                                logoUrl: data.logoUrl,
                                faviconUrl: data.faviconUrl,
                            };
                            return [3 /*break*/, 12];
                        case 4: return [4 /*yield*/, this.stripe.createConnectedAccount({
                                email: org.contactEmail,
                                businessName: org.legalName,
                                country: 'US',
                            })];
                        case 5:
                            account = _f.sent();
                            org.stripeConnectedAccountId = account.id;
                            return [3 /*break*/, 12];
                        case 6:
                            _i = 0, _b = (data.emails || []);
                            _f.label = 7;
                        case 7:
                            if (!(_i < _b.length)) return [3 /*break*/, 10];
                            email = _b[_i];
                            return [4 /*yield*/, this.mail.sendStaffInvitation({
                                    to: email, orgName: org.name, orgId: org.id,
                                })];
                        case 8:
                            _f.sent();
                            _f.label = 9;
                        case 9:
                            _i++;
                            return [3 /*break*/, 7];
                        case 10: return [3 /*break*/, 12];
                        case 11:
                            org.complianceConfig = {
                                ageVerificationRequired: (_c = data.ageVerification) !== null && _c !== void 0 ? _c : true,
                                medicalOnly: (_d = data.medicalOnly) !== null && _d !== void 0 ? _d : false,
                                dailyPurchaseLimit: data.dailyLimit,
                                requireIdScan: (_e = data.requireIdScan) !== null && _e !== void 0 ? _e : false,
                            };
                            return [3 /*break*/, 12];
                        case 12:
                            if (!org.completedSteps)
                                org.completedSteps = [];
                            if (!org.completedSteps.includes(step))
                                org.completedSteps.push(step);
                            idx = STEP_ORDER.indexOf(step);
                            org.onboardingStep = idx < STEP_ORDER.length - 1
                                ? STEP_ORDER[idx + 1] : OnboardingStep.REVIEW_LAUNCH;
                            if (idx === STEP_ORDER.length - 1)
                                org.onboardingComplete = true;
                            return [4 /*yield*/, this.orgRepo.save(org)];
                        case 13:
                            _f.sent();
                            return [2 /*return*/, this.getStatus(orgId)];
                    }
                });
            });
        };
        OnboardingService_1.prototype.generateSlug = function (name) {
            return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        };
        return OnboardingService_1;
    }());
    __setFunctionName(_classThis, "OnboardingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OnboardingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OnboardingService = _classThis;
}();
exports.OnboardingService = OnboardingService;
