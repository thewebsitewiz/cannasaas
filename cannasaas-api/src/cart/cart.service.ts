import { Injectable } from '@nestjs/common';

@Injectable()
export class CartService {
  async getCartForUser(userId: string) {
    return null;
  }

  async getCartSummary(userId: string, dispensaryId: string) {
    return { items: [], subtotal: 0, tax: 0, total: 0 };
  }

  async clearCart(userId: string, dispensaryId?: string) {
    // TODO: implement
  }
}
