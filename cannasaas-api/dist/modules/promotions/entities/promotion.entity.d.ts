export declare enum PromotionType {
    PERCENTAGE = "percentage",
    FIXED_AMOUNT = "fixed_amount",
    BUY_X_GET_Y = "buy_x_get_y",
    FREE_SHIPPING = "free_shipping"
}
export declare class Promotion {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    type: PromotionType;
    value: number;
    minimumOrderValue: number;
    maximumDiscount: number;
    conditions: {
        productIds?: string[];
        categoryIds?: string[];
        buyQuantity?: number;
        getQuantity?: number;
        firstTimeOnly?: boolean;
        minItems?: number;
    };
    usageLimit: number;
    usageCount: number;
    perCustomerLimit: number;
    startsAt: Date;
    expiresAt: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
