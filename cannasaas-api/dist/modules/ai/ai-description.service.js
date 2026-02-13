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
exports.AiDescriptionService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/entities/product.entity");
let AiDescriptionService = class AiDescriptionService {
    constructor(productRepo) {
        this.productRepo = productRepo;
        this.anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    async generateDescription(productId, options) {
        const product = await this.productRepo.findOneOrFail({
            where: { id: productId },
        });
        const prompt = `Generate a product description for a cannabis dispensary.

Product: ${product.name}
Category: ${product.category || 'General'}
Strain Type: ${product.strainType || 'N/A'}
THC: ${product.thcContent || 'N/A'}%
CBD: ${product.cbdContent || 'N/A'}%
Terpenes: ${product.terpenes?.join(', ') || 'N/A'}
Brand: ${product.brand || 'N/A'}

Requirements:
- Tone: ${options?.tone || 'professional'}
- Maximum ${options?.maxLength || 300} words
- SEO-friendly with natural keyword inclusion
- Do NOT make medical claims
- Focus on flavor profile, aroma, and experience`;
        const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });
        const description = response.content[0].type === 'text'
            ? response.content[0].text : '';
        product.aiDescription = description;
        product.aiDescriptionGeneratedAt = new Date();
        await this.productRepo.save(product);
        return { productId, description };
    }
    async bulkGenerate(orgId, productIds, tone) {
        const results = [];
        for (const id of productIds) {
            try {
                const result = await this.generateDescription(id, { tone: tone });
                results.push({ ...result, success: true });
            }
            catch (error) {
                results.push({ productId: id, success: false, error: error.message });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return results;
    }
};
exports.AiDescriptionService = AiDescriptionService;
exports.AiDescriptionService = AiDescriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AiDescriptionService);
//# sourceMappingURL=ai-description.service.js.map