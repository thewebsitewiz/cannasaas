export declare enum Feature {
    MULTI_LOCATION = "multi_location",
    SUBSCRIPTION_ORDERS = "subscription_orders",
    LOYALTY_PROGRAM = "loyalty_program",
    AI_RECOMMENDATIONS = "ai_recommendations",
    AI_CHATBOT = "ai_chatbot",
    ADVANCED_ANALYTICS = "advanced_analytics",
    CUSTOM_DOMAIN = "custom_domain",
    API_ACCESS = "api_access",
    GIFT_CARDS = "gift_cards",
    DELIVERY_TRACKING = "delivery_tracking",
    METRC_INTEGRATION = "metrc_integration",
    WHITE_LABEL = "white_label",
    BULK_IMPORT = "bulk_import",
    MULTI_CURRENCY = "multi_currency"
}
export declare enum Plan {
    STARTER = "starter",
    PROFESSIONAL = "professional",
    ENTERPRISE = "enterprise"
}
export declare const PLAN_FEATURES: Record<Plan, Feature[]>;
export declare class FeatureFlag {
    id: string;
    organizationId: string;
    plan: Plan;
    overrides: Record<string, boolean>;
    createdAt: Date;
    updatedAt: Date;
}
