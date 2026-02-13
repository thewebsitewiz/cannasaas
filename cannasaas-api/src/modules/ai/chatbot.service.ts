// cannasaas-api/src/modules/ai/chatbot.service.ts
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

@Injectable()
export class ChatbotService {
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(orgId: string, userId: string | null,
    message: string, history: ChatMessage[] = []) {

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
        ...history.map(m => ({ role: m.role as any, content: m.content })),
        { role: 'user', content: message },
      ],
    });

    return {
      reply: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: { inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens },
    };
  }

  private async buildContext(orgId: string, query: string,
    userId: string | null): Promise<string> {
    const parts: string[] = [];
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (keywords.length > 0) {
      const products = await this.productRepo.find({
        where: keywords.map(k => [
          { organizationId: orgId, name: ILike(`%${k}%`), active: true },
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
}
