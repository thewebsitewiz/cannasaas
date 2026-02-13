import { User } from '../../users/entities/user.entity';
export declare class Cart {
    id: string;
    userId: string;
    organizationId: string;
    items: any[];
    total: number;
    checkedOut: boolean;
    user: User;
    createdAt: Date;
    updatedAt: Date;
}
