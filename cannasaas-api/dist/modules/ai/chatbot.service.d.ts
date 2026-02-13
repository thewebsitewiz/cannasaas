import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
export declare class ChatbotService {
    private productRepo;
    private orderRepo;
    private readonly anthropic;
    constructor(productRepo: Repository<Product>, orderRepo: Repository<Order>);
    chat(orgId: string, userId: string | null, message: string, history?: ChatMessage[]): Promise<{
        reply: string;
        usage: {
            inputTokens: number;
            outputTokens: number;
        };
    }>;
    private buildContext;
}
export {};
