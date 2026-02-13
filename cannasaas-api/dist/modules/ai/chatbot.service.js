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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/entities/product.entity");
const order_entity_1 = require("../orders/entities/order.entity");
let ChatbotService = class ChatbotService {
    constructor(productRepo, orderRepo) {
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
        this.anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    async chat(orgId, userId, message, history = []) {
        const context = await this.buildContext(orgId, message, userId);
        const systemPrompt = `You are a helpful cannabis dispensary assistant.
Rules:
- NEVER make medical claims or prescribe cannabis for conditions
- Always recommend consulting a budtender for personalized advice
- Keep responses concise (under 200 words)
- Recommend products from the catalog when relevant

Current catalog context:
${context}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            system: systemPrompt,
            messages: [
                ...history.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: message },
            ],
        });
        return {
            reply: response.content[0].type === 'text' ? response.content[0].text : '',
            usage: { inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens },
        };
    }
    async buildContext(orgId, query, userId) {
        const parts = [];
        const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (keywords.length > 0) {
            const products = await this.productRepo.find({
                where: keywords.map(k => [
                    { organizationId: orgId, name: (0, typeorm_2.ILike)(`%${k}%`), active: true },
                ]).flat(),
                take: 5,
            });
            if (products.length > 0) {
                parts.push('Matching Products:');
                products.forEach(p => {
                    parts.push(`- ${p.name} ($${p.price})`
                        + (p.strainType ? ` | ${p.strainType}` : '')
                        + (p.thcContent ? ` | THC: ${p.thcContent}%` : ''));
                });
            }
        }
        if (userId && /order|status|track|deliver/i.test(query)) {
            const recent = await this.orderRepo.find({
                where: { customerId: userId, organizationId: orgId },
                order: { createdAt: 'DESC' }, take: 3,
            });
            if (recent.length > 0) {
                parts.push('\nRecent Orders:');
                recent.forEach(o => parts.push(`- #${o.orderNumber}: ${o.status} ($${o.total})`));
            }
        }
        return parts.join('\n') || 'No specific products match.';
    }
};
exports.ChatbotService = ChatbotService;
exports.ChatbotService = ChatbotService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatbotService);
//# sourceMappingURL=chatbot.service.js.map