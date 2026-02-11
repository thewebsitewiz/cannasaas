import { Cart } from './cart.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
export declare class CartItem {
    id: string;
    cartId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    cart: Cart;
    variant: ProductVariant;
}
