export const SITE_LIMITS = {
    FREE: 3,
    PRO: 10,
    ENTERPRISE: 1000,
} as const;

export type SubscriptionTier = keyof typeof SITE_LIMITS;
