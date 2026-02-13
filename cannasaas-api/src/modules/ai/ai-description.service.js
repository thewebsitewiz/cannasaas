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
exports.AiDescriptionService = void 0;
// cannasaas-api/src/modules/ai/ai-description.service.ts
var common_1 = require("@nestjs/common");
var sdk_1 = require("@anthropic-ai/sdk");
var AiDescriptionService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AiDescriptionService = _classThis = /** @class */ (function () {
        function AiDescriptionService_1(productRepo) {
            this.productRepo = productRepo;
            this.anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
        AiDescriptionService_1.prototype.generateDescription = function (productId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var product, prompt, response, description;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.productRepo.findOneOrFail({
                                where: { id: productId }, relations: ['category'],
                            })];
                        case 1:
                            product = _c.sent();
                            prompt = "Generate a product description for a cannabis dispensary.\n\nProduct: ".concat(product.name, "\nCategory: ").concat(((_a = product.category) === null || _a === void 0 ? void 0 : _a.name) || 'General', "\nStrain Type: ").concat(product.strainType || 'N/A', "\nTHC: ").concat(product.thcContent || 'N/A', "%\nCBD: ").concat(product.cbdContent || 'N/A', "%\nTerpenes: ").concat(((_b = product.terpenes) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'N/A', "\nBrand: ").concat(product.brand || 'N/A', "\n\nRequirements:\n- Tone: ").concat((options === null || options === void 0 ? void 0 : options.tone) || 'professional', "\n- Maximum ").concat((options === null || options === void 0 ? void 0 : options.maxLength) || 300, " words\n- SEO-friendly with natural keyword inclusion\n- Do NOT make medical claims\n- Focus on flavor profile, aroma, and experience");
                            return [4 /*yield*/, this.anthropic.messages.create({
                                    model: 'claude-sonnet-4-20250514',
                                    max_tokens: 1024,
                                    messages: [{ role: 'user', content: prompt }],
                                })];
                        case 2:
                            response = _c.sent();
                            description = response.content[0].type === 'text'
                                ? response.content[0].text : '';
                            product.aiDescription = description;
                            product.aiDescriptionGeneratedAt = new Date();
                            return [4 /*yield*/, this.productRepo.save(product)];
                        case 3:
                            _c.sent();
                            return [2 /*return*/, { productId: productId, description: description }];
                    }
                });
            });
        };
        AiDescriptionService_1.prototype.bulkGenerate = function (orgId, productIds, tone) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, productIds_1, id, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, productIds_1 = productIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < productIds_1.length)) return [3 /*break*/, 8];
                            id = productIds_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.generateDescription(id, { tone: tone })];
                        case 3:
                            result = _a.sent();
                            results.push(__assign(__assign({}, result), { success: true }));
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            results.push({ productId: id, success: false, error: error_1.message });
                            return [3 /*break*/, 5];
                        case 5: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                        case 6:
                            _a.sent(); // Rate limit
                            _a.label = 7;
                        case 7:
                            _i++;
                            return [3 /*break*/, 1];
                        case 8: return [2 /*return*/, results];
                    }
                });
            });
        };
        return AiDescriptionService_1;
    }());
    __setFunctionName(_classThis, "AiDescriptionService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AiDescriptionService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AiDescriptionService = _classThis;
}();
exports.AiDescriptionService = AiDescriptionService;
