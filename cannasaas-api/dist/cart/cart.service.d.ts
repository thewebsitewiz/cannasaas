export declare class CartService {
    getCartForUser(userId: string): Promise<any>;
    getCartSummary(userId: string, dispensaryId: string): Promise<{
        items: any[];
        subtotal: number;
        tax: number;
        total: number;
    }>;
    clearCart(userId: string, dispensaryId?: string): Promise<void>;
}
