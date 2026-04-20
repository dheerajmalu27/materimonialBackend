import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SfgZLWruNrsgWDWIvL',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'IAuZ1fRCteCgS28S5oV8icSJ123',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: process.env.RAZORPAY_CURRENCY || 'INR',
  },

  monetization: {
    freeDailyInterestsLimit: parseInt(process.env.MONETIZATION_FREE_DAILY_INTERESTS_LIMIT || '5', 10),
    freeDailyMessagesLimit: parseInt(process.env.MONETIZATION_FREE_DAILY_MESSAGES_LIMIT || '5', 10),
    freeUnlimitedInterests: process.env.MONETIZATION_FREE_UNLIMITED_INTERESTS === 'true',
    freeAdvancedSearch: process.env.MONETIZATION_FREE_ADVANCED_SEARCH === 'true',
    freeVerifiedBadge: process.env.MONETIZATION_FREE_VERIFIED_BADGE === 'true',
    freeBasicMessaging: process.env.MONETIZATION_FREE_BASIC_MESSAGING !== 'false',
    freeLimitedSearch: process.env.MONETIZATION_FREE_LIMITED_SEARCH !== 'false',

    premiumYearlyPriceInr: parseInt(process.env.MONETIZATION_PREMIUM_YEARLY_PRICE_INR || '1200', 10),
    premiumDurationDays: parseInt(process.env.MONETIZATION_PREMIUM_DURATION_DAYS || '365', 10),
    premiumUnlimitedInterests: process.env.MONETIZATION_PREMIUM_UNLIMITED_INTERESTS !== 'false',
    premiumAdvancedSearch: process.env.MONETIZATION_PREMIUM_ADVANCED_SEARCH !== 'false',
    premiumVerifiedBadge: process.env.MONETIZATION_PREMIUM_VERIFIED_BADGE !== 'false',
    premiumBasicMessaging: process.env.MONETIZATION_PREMIUM_BASIC_MESSAGING !== 'false',
  },

  activity: {
    retentionDays: parseInt(process.env.USER_ACTIVITY_RETENTION_DAYS || '180', 10),
  },
};
