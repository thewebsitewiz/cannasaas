import { CartItem } from './cart-item.entity';
import { Dispensary } from '../../dispensaries/entities/dispensary.entity';
import { User } from '../../users/entities/user.entity';
export declare class Cart {
    id: string;
    userId: string;
    dispensaryId: string;
    expiresAt: Date;
    user: User;
    dispensary: Dispensary;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}
