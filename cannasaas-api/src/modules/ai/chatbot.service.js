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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
// cannasaas-api/src/modules/ai/chatbot.service.ts
var common_1 = require("@nestjs/common");
var sdk_1 = require("@anthropic-ai/sdk");
var typeorm_1 = require("typeorm");
var ChatbotService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ChatbotService = _classThis = /** @class */ (function () {
        function ChatbotService_1(productRepo, orderRepo) {
            this.productRepo = productRepo;
            this.orderRepo = orderRepo;
            this.anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        }
        ChatbotService_1.prototype.chat = function (orgId_1, userId_1, message_1) {
            return __awaiter(this, arguments, void 0, function (orgId, userId, message, history) {
                var context, systemPrompt, response;
                if (history === void 0) { history = []; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.buildContext(orgId, message, userId)];
                        case 1:
                            context = _a.sent();
                            systemPrompt = "You are a helpful cannabis dispensary assistant.\nRules:\n- NEVER make medical claims or prescribe cannabis for conditions\n- Always recommend consulting a budtender for personalized advice\n- Keep responses concise (under 200 words)\n- Recommend products from the catalog when relevant\n\nCurrent catalog context:\n".concat(context);
                            return [4 /*yield*/, this.anthropic.messages.create({
                                    model: 'claude-sonnet-4-20250514',
                                    max_tokens: 512,
                                    system: systemPrompt,
                                    messages: __spreadArray(__spreadArray([], history.map(function (m) { return ({ role: m.role, content: m.content }); }), true), [
                                        { role: 'user', content: message },
                                    ], false),
                                })];
                        case 2:
                            response = _a.sent();
                            return [2 /*return*/, {
                                    reply: response.content[0].type === 'text' ? response.content[0].text : '',
                                    usage: { inputTokens: response.usage.input_tokens,
                                        outputTokens: response.usage.output_tokens },
                                }];
                    }
                });
            });
        };
        ChatbotService_1.prototype.buildContext = function (orgId, query, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var parts, keywords, products, recent;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parts = [];
                            keywords = query.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 2; });
                            if (!(keywords.length > 0)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.productRepo.find({
                                    where: keywords.map(function (k) { return [
                                        { organizationId: orgId, name: (0, typeorm_1.ILike)("%".concat(k, "%")), active: true },
                                    ]; }).flat(),
                                    take: 5,
                                })];
                        case 1:
                            products = _a.sent();
                            if (products.length > 0) {
                                parts.push('Matching Products:');
                                products.forEach(function (p) {
                                    parts.push("- ".concat(p.name, " ($").concat(p.price, ")")
                                        + (p.strainType ? " | ".concat(p.strainType) : '')
                                        + (p.thcContent ? " | THC: ".concat(p.thcContent, "%") : ''));
                                });
                            }
                            _a.label = 2;
                        case 2:
                            if (!(userId && /order|status|track|deliver/i.test(query))) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.orderRepo.find({
                                    where: { customerId: userId, organizationId: orgId },
                                    order: { createdAt: 'DESC' }, take: 3,
                                })];
                        case 3:
                            recent = _a.sent();
                            if (recent.length > 0) {
                                parts.push('\nRecent Orders:');
                                recent.forEach(function (o) { return parts.push("- #".concat(o.orderNumber, ": ").concat(o.status, " ($").concat(o.total, ")")); });
                            }
                            _a.label = 4;
                        case 4: return [2 /*return*/, parts.join('\n') || 'No specific products match.'];
                    }
                });
            });
        };
        return ChatbotService_1;
    }());
    __setFunctionName(_classThis, "ChatbotService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatbotService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatbotService = _classThis;
}();
exports.ChatbotService = ChatbotService;
