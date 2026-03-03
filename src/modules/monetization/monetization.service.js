import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Op } from 'sequelize';
import { env } from '../../config/env.js';
import Interest from '../../models/interest.model.js';
import Message from '../../models/message.model.js';
import UserActivity from '../../models/userActivity.model.js';

const getBaseConfig = () => {
  const premiumAmountInr = Number.isFinite(env.monetization.premiumYearlyPriceInr)
    ? env.monetization.premiumYearlyPriceInr
    : 1200;

  const freeDailyLimit = Number.isFinite(env.monetization.freeDailyInterestsLimit)
    ? env.monetization.freeDailyInterestsLimit
    : 5;

  const freeDailyMessagesLimit = Number.isFinite(env.monetization.freeDailyMessagesLimit)
    ? env.monetization.freeDailyMessagesLimit
    : 5;

  return {
    currency: env.razorpay.currency || 'INR',
    plans: {
      free: {
        planCode: 'free',
        displayName: 'Free Tier',
        billingCycle: 'none',
        priceInr: 0,
        durationDays: 0,
        features: {
          basicMessaging: env.monetization.freeBasicMessaging,
          videoCall: false,
          limitedSearch: env.monetization.freeLimitedSearch,
          advancedSearch: env.monetization.freeAdvancedSearch,
          verifiedBadge: env.monetization.freeVerifiedBadge,
          unlimitedInterests: env.monetization.freeUnlimitedInterests,
          dailyInterestsLimit: env.monetization.freeUnlimitedInterests ? null : Math.max(0, freeDailyLimit),
          dailyMessagesLimit: Math.max(0, freeDailyMessagesLimit),
        }
      },
      premium: {
        planCode: 'premium_yearly',
        displayName: 'Premium',
        billingCycle: 'yearly',
        priceInr: Math.max(0, premiumAmountInr),
        durationDays: Math.max(1, env.monetization.premiumDurationDays || 365),
        features: {
          basicMessaging: env.monetization.premiumBasicMessaging,
          videoCall: true,
          limitedSearch: false,
          advancedSearch: env.monetization.premiumAdvancedSearch,
          verifiedBadge: env.monetization.premiumVerifiedBadge,
          unlimitedInterests: env.monetization.premiumUnlimitedInterests,
          dailyInterestsLimit: env.monetization.premiumUnlimitedInterests ? null : Math.max(0, freeDailyLimit),
          dailyMessagesLimit: null,
        }
      }
    }
  };
};

const getPlanFromActivity = (activity) => {
  if (!activity?.description) return null;

  try {
    const parsed = JSON.parse(activity.description);
    if (!parsed?.planCode || !parsed?.expiresAt) return null;

    const expiresAt = new Date(parsed.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return null;
    if (expiresAt.getTime() <= Date.now()) return null;

    return {
      ...parsed,
      expiresAt: expiresAt.toISOString(),
      startedAt: parsed.startedAt ? new Date(parsed.startedAt).toISOString() : activity.createdAt?.toISOString?.() || null,
    };
  } catch (error) {
    return null;
  }
};

const getRazorpayClient = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    const err = new Error('Razorpay keys are not configured');
    err.statusCode = 500;
    throw err;
  }

  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
};

export const getMonetizationConfig = () => {
  return getBaseConfig();
};

export const getActiveSubscription = async (userId) => {
  const latestSubscription = await UserActivity.findOne({
    where: {
      userId,
      action: 'subscription_activated',
    },
    order: [['id', 'DESC']],
  });

  return getPlanFromActivity(latestSubscription);
};

export const getUserEntitlements = async (userId) => {
  const config = getBaseConfig();
  const activeSubscription = await getActiveSubscription(userId);
  const hasPremium = Boolean(activeSubscription);
  const activePlanKey = hasPremium ? 'premium' : 'free';

  return {
    activePlan: activePlanKey,
    planCode: config.plans[activePlanKey].planCode,
    features: config.plans[activePlanKey].features,
    subscription: activeSubscription,
  };
};

export const getTodayInterestUsage = async (userId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await Interest.count({
    where: {
      senderId: userId,
      createdAt: {
        [Op.between]: [start, end],
      },
    },
  });

  return count;
};

export const enforceInterestQuota = async (userId) => {
  const entitlements = await getUserEntitlements(userId);
  const dailyLimit = entitlements.features.dailyInterestsLimit;

  if (dailyLimit === null) {
    return {
      allowed: true,
      usedToday: await getTodayInterestUsage(userId),
      dailyLimit: null,
      remainingToday: null,
      activePlan: entitlements.activePlan,
    };
  }

  const usedToday = await getTodayInterestUsage(userId);

  if (usedToday >= dailyLimit) {
    const error = new Error(`Daily interest limit reached (${dailyLimit}). Upgrade plan or change config to allow unlimited interests.`);
    error.statusCode = 403;
    error.code = 'DAILY_INTEREST_LIMIT_REACHED';
    error.meta = {
      dailyLimit,
      usedToday,
      remainingToday: 0,
      activePlan: entitlements.activePlan,
      features: entitlements.features,
    };
    throw error;
  }

  return {
    allowed: true,
    usedToday,
    dailyLimit,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    activePlan: entitlements.activePlan,
  };
};

export const getTodayMessageUsage = async (userId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await Message.count({
    where: {
      senderId: userId,
      sentAt: {
        [Op.between]: [start, end],
      },
    },
  });

  return count;
};

export const enforceMessageQuota = async (userId) => {
  const entitlements = await getUserEntitlements(userId);

  if (entitlements.activePlan === 'premium') {
    return {
      allowed: true,
      usedToday: await getTodayMessageUsage(userId),
      dailyLimit: null,
      remainingToday: null,
      activePlan: entitlements.activePlan,
    };
  }

  const dailyLimit = Number.isFinite(entitlements.features?.dailyMessagesLimit)
    ? Math.max(0, entitlements.features.dailyMessagesLimit)
    : 5;

  const usedToday = await getTodayMessageUsage(userId);

  if (usedToday >= dailyLimit) {
    const error = new Error(`Daily message limit reached (${dailyLimit}). Upgrade to Premium for unlimited messaging.`);
    error.statusCode = 403;
    error.code = 'DAILY_MESSAGE_LIMIT_REACHED';
    error.meta = {
      dailyLimit,
      usedToday,
      remainingToday: 0,
      activePlan: entitlements.activePlan,
      features: entitlements.features,
    };
    throw error;
  }

  return {
    allowed: true,
    usedToday,
    dailyLimit,
    remainingToday: Math.max(0, dailyLimit - usedToday),
    activePlan: entitlements.activePlan,
  };
};

export const createPremiumOrder = async (userId) => {
  const config = getBaseConfig();
  const premiumPlan = config.plans.premium;

  const amountInPaise = Math.round((premiumPlan.priceInr || 0) * 100);
  if (amountInPaise <= 0) {
    const err = new Error('Premium plan price must be greater than 0');
    err.statusCode = 400;
    throw err;
  }

  const razorpay = getRazorpayClient();
  const receipt = `premium_${userId}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: config.currency,
    receipt,
    notes: {
      userId: String(userId),
      planCode: premiumPlan.planCode,
      durationDays: String(premiumPlan.durationDays),
    },
  });

  return {
    keyId: env.razorpay.keyId,
    order,
    plan: {
      planCode: premiumPlan.planCode,
      displayName: premiumPlan.displayName,
      amountInr: premiumPlan.priceInr,
      amountInPaise,
      currency: config.currency,
      durationDays: premiumPlan.durationDays,
      features: premiumPlan.features,
    },
  };
};

export const verifyAndActivatePremium = async (userId, payload) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = payload || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const err = new Error('Missing Razorpay payment verification fields');
    err.statusCode = 400;
    throw err;
  }

  const secret = env.razorpay.keySecret;
  if (!secret) {
    const err = new Error('Razorpay key secret is not configured');
    err.statusCode = 500;
    throw err;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    const err = new Error('Invalid Razorpay signature');
    err.statusCode = 400;
    throw err;
  }

  const config = getBaseConfig();
  const premiumPlan = config.plans.premium;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + premiumPlan.durationDays * 24 * 60 * 60 * 1000);

  const description = {
    planCode: premiumPlan.planCode,
    planName: premiumPlan.displayName,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    amountInr: premiumPlan.priceInr,
    amountInPaise: premiumPlan.priceInr * 100,
    currency: config.currency,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  };

  await UserActivity.create({
    userId,
    action: 'subscription_activated',
    description: JSON.stringify(description),
  });

  return {
    success: true,
    subscription: description,
    features: premiumPlan.features,
  };
};
