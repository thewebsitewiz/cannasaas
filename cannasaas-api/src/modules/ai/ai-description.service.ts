// cannasaas-api/src/modules/ai/ai-description.service.ts
import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AiDescriptionService {
  private readonly anthropic: Anthropic;

  constructor(@InjectRepository(Product) private productRepo: Repository<Product>) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generateDescription(productId: string, options?: {
    tone?: 'professional' | 'casual' | 'medical' | 'luxury';
    maxLength?: number;
  }) {
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

  async bulkGenerate(orgId: string, productIds: string[], tone?: string) {
    const results = [];
    for (const id of productIds) {
      try {
        const result = await this.generateDescription(id, { tone: tone as any });
        results.push({ ...result, success: true });
      } catch (error) {
        results.push({ productId: id, success: false, error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
    }
    return results;
  }
}
