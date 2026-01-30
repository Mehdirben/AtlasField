export const SITE_LIMITS = {
    free: 3,
    pro: 10,
    enterprise: 1000,
} as const;

export type SubscriptionTier = keyof typeof SITE_LIMITS;
