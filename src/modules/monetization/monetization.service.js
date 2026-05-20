import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Op, fn, col, where } from 'sequelize';
import { env } from '../../config/env.js';
import Interest from '../../models/interest.model.js';
import Message from '../../models/message.model.js';
import PaymentTransaction from '../../models/paymentTransaction.model.js';
import UserActivity from '../../models/userActivity.model.js';
import SubscriptionPlan from '../../models/subscriptionPlan.model.js';
import { logActivity } from '../../utils/activityLogger.js';

// Cache for subscription plans loaded from database
let cachedPlans = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

const getFreePlanFeatures = () => {
  const freeDailyLimit = Number.isFinite(env.monetization.freeDailyInterestsLimit)
    ? env.monetization.freeDailyInterestsLimit
    : 5;
  const freeDailyMessagesLimit = Number.isFinite(env.monetization.freeDailyMessagesLimit)
    ? env.monetization.freeDailyMessagesLimit
    : 5;
console.log('Free plan features from env:',  {
    basicMessaging: env.monetization.freeBasicMessaging,
    videoCall: false,
    limitedSearch: env.monetization.freeLimitedSearch,
    advancedSearch: env.monetization.freeAdvancedSearch,
    verifiedBadge: env.monetization.freeVerifiedBadge,
    unlimitedInterests: env.monetization.freeUnlimitedInterests,
    dailyInterestsLimit: Math.max(0, freeDailyLimit),
    dailyMessagesLimit: Math.max(0, freeDailyMessagesLimit),
  });
  return {
    basicMessaging: env.monetization.freeBasicMessaging,
    videoCall: false,
    limitedSearch: env.monetization.freeLimitedSearch,
    advancedSearch: env.monetization.freeAdvancedSearch,
    verifiedBadge: env.monetization.freeVerifiedBadge,
    unlimitedInterests: env.monetization.freeUnlimitedInterests,
    dailyInterestsLimit: Math.max(0, freeDailyLimit),
    dailyMessagesLimit: Math.max(0, freeDailyMessagesLimit),
  };
};

const getPremiumPlanFeatures = () => {
  const freeDailyLimit = Number.isFinite(env.monetization.freeDailyInterestsLimit)
    ? env.monetization.freeDailyInterestsLimit
    : 5;

  return {
    basicMessaging: env.monetization.premiumBasicMessaging,
    videoCall: true,
    limitedSearch: false,
    advancedSearch: env.monetization.premiumAdvancedSearch,
    verifiedBadge: env.monetization.premiumVerifiedBadge,
    unlimitedInterests: env.monetization.premiumUnlimitedInterests,
    dailyInterestsLimit: env.monetization.premiumUnlimitedInterests ? null : Math.max(0, freeDailyLimit),
    dailyMessagesLimit: null,
  };
};

const loadPlansFromDatabase = async () => {
  const now = Date.now();
  console.log('Loading subscription plans from database...');
  // Return cached plans if still valid
  // if (cachedPlans && (now - cacheTimestamp) < CACHE_TTL_MS) {
    
  // console.log(cachedPlans);
  //   return cachedPlans;
  // }

  try {
    // Load all plans from database
    const dbPlans = await SubscriptionPlan.findAll({
      order: [['id', 'ASC']]
    });

    const plans = {};
    // console.log('Database plans:', dbPlans);
    // Always add free plan with config from env
    plans.free = {
      planCode: 'Free',
      displayName: 'Free Tier',
      billingCycle: 'none',
      priceInr: 0,
      durationDays: 0,
      features: getFreePlanFeatures(),
    };

// Add plans from database
    for (const dbPlan of dbPlans) {
      const planName = dbPlan.planName?.toLowerCase();
      
      // Determine billing cycle based on plan name
      let billingCycle = 'yearly';
       if (planName?.includes('Diamond') || planName?.includes('Premium')) {
        billingCycle = 'yearly';
      } else if (planName?.includes('Free')) {
        billingCycle = 'none';
      }

      // Generate planCode from planName
      const planCode = planName?.replace(/\s+/g, '_') || `plan_${dbPlan.id}`;

      // Use features from database if available, otherwise use default premium features
      const planFeatures = dbPlan.features || getPremiumPlanFeatures();

      plans[planName] = {
        planCode,
        displayName: dbPlan.planName || 'Plan',
        billingCycle,
        priceInr: Math.max(0, dbPlan.price || 0),
        durationDays: Math.max(1, dbPlan.durationDays || 365),
        features: planFeatures,
      };
    }

    cachedPlans = plans;
    cacheTimestamp = now;
    console.log('Loaded plans:', plans);
    return plans;
  } catch (error) {
    console.error('Failed to load subscription plans from database:', error);
    
    // Return default plans if database fails
    return {
      free: {
        planCode: 'free',
        displayName: 'Free Tier',
        billingCycle: 'none',
        priceInr: 0,
        durationDays: 0,
        features: getFreePlanFeatures(),
      },
      premium: {
        planCode: 'premium_yearly',
        displayName: 'Premium',
        billingCycle: 'yearly',
        priceInr: 1200,
        durationDays: 365,
        features: getPremiumPlanFeatures(),
      },
    };
  }
};

const getBaseConfig = async () => {
  const plans = await loadPlansFromDatabase();
  console.log('Base monetization config:', { plans });
  return {
    currency: env.razorpay.currency || 'INR',
    plans,
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

const toJsonString = (value) => {
  if (value === undefined || value === null) return null;
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    return null;
  }
};

const findPaymentTransaction = async ({ razorpayOrderId, razorpayPaymentId }) => {
  if (razorpayPaymentId) {
    const byPaymentId = await PaymentTransaction.findOne({
      where: { razorpayPaymentId },
      order: [['id', 'DESC']],
    });
    if (byPaymentId) return byPaymentId;
  }

  if (razorpayOrderId) {
    return await PaymentTransaction.findOne({
      where: { razorpayOrderId },
      order: [['id', 'DESC']],
    });
  }

  return null;
};

const trackPaymentEvent = async ({
  userId,
  planCode,
  razorpayOrderId,
  razorpayPaymentId,
  receipt,
  amountPaise,
  currency,
  status,
  source,
  eventType,
  verificationMethod,
  rawPayload,
  metadata,
}) => {
  if (!status || !source) return null;

  const existing = await findPaymentTransaction({ razorpayOrderId, razorpayPaymentId });

  const payload = Object.fromEntries(
    Object.entries({
      userId,
      provider: 'razorpay',
      planCode,
      razorpayOrderId,
      razorpayPaymentId,
      receipt,
      amountPaise,
      currency,
      status,
      source,
      eventType,
      verificationMethod,
      rawPayload: toJsonString(rawPayload),
      metadata,
      updatedAt: new Date(),
    }).filter(([, value]) => value !== undefined)
  );

  if (existing) {
    await existing.update(payload);
    return existing;
  }

  return await PaymentTransaction.create({
    ...payload,
    createdAt: new Date(),
  });
};

const safeTrackPaymentEvent = async (payload) => {
  try {
    return await trackPaymentEvent(payload);
  } catch (error) {
    return null;
  }
};

const findActivationByPaymentId = async (userId, razorpayPaymentId) => {
  if (!razorpayPaymentId) return null;

  return await UserActivity.findOne({
    where: {
      userId,
      [Op.and]: [
        where(fn('LOWER', col('action')), 'subscription_activated'),
      ],
      description: {
        [Op.like]: `%\"razorpayPaymentId\":\"${razorpayPaymentId}\"%`,
      },
    },
    order: [['id', 'DESC']],
  });
};

const activatePremiumSubscription = async ({
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  source = 'client_verify',
  planCode,
}) => {
  const existingActivation = await findActivationByPaymentId(userId, razorpayPaymentId);
  if (existingActivation) {
    const subscription = getPlanFromActivity(existingActivation);
    const config = await getBaseConfig();
    return {
      success: true,
      alreadyActivated: true,
      subscription,
      features: config.plans.premium?.features,
    };
  }

  const config = await getBaseConfig();
  
  // Find the plan by planCode or fall back to premium
  let selectedPlan = config.plans.premium;
  if (planCode) {
    for (const [key, plan] of Object.entries(config.plans)) {
      if (plan.planCode === planCode || key === planCode) {
        selectedPlan = plan;
        break;
      }
    }
  }
  
  if (!selectedPlan) {
    selectedPlan = config.plans.premium;
  }
  
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);

  const description = {
    planCode: selectedPlan.planCode,
    planName: selectedPlan.displayName,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    amountInr: selectedPlan.priceInr,
    amountInPaise: selectedPlan.priceInr * 100,
    currency: config.currency,
    razorpayOrderId,
    razorpayPaymentId,
    activatedVia: source,
  };

  await logActivity({
    userId,
    action: 'subscription_activated',
    description,
  });

  // Update plan-dependent defaults in user.settings based on backend subscription state
  try {
    // Map plan code -> premium/free for now.
    // If you add more plans later (Diamond/Gold), extend mapping here.
    const isPremiumLike = true;

    const { defaultWebsiteSettingsByPlan } = await import('../user/defaultWebsiteSettings.js');

    const base = defaultWebsiteSettingsByPlan.free;
    const upgraded = isPremiumLike ? defaultWebsiteSettingsByPlan.premium : base;

    // Never trust frontend; only backend entitlements decide.
    const user = await (await import('../../models/user.model.js')).default.findByPk(userId);
    if (user) {
      user.settings = {
        ...(user.settings && typeof user.settings === 'object' ? user.settings : {}),
        ...upgraded,
        billing: {
          ...(user.settings?.billing && typeof user.settings.billing === 'object' ? user.settings.billing : {}),
          ...upgraded.billing,
          currentPlan: upgraded.billing.currentPlan,
        },
      };
      await user.save();
    }
  } catch (e) {
    console.error('Failed to update user.settings after subscription activation:', e?.message || e);
  }

  return {
    success: true,
    alreadyActivated: false,
    subscription: description,
    features: selectedPlan.features,
  };
};

export const getMonetizationConfig = async () => {
  const configdata = await getBaseConfig();
  console.log('Fetching monetization config...',configdata);
  return configdata;
};

export const getActiveSubscription = async (userId) => {
  const latestSubscription = await UserActivity.findOne({
    where: {
      userId,
      [Op.and]: [
        where(fn('LOWER', col('action')), 'subscription_activated'),
      ],
    },
    order: [['id', 'DESC']],
  });

  return getPlanFromActivity(latestSubscription);
};

export const getUserEntitlements = async (userId) => {
  const config = await getBaseConfig();
  const activeSubscription = await getActiveSubscription(userId);
  const hasPremium = Boolean(activeSubscription);
  
  // Find the active plan based on subscription planCode
  let activePlanKey = 'free';
  if (hasPremium && activeSubscription?.planCode) {
    // Find matching plan key from config
    for (const [key, plan] of Object.entries(config.plans)) {
      if (plan.planCode === activeSubscription.planCode) {
        activePlanKey = key;
        break;
      }
    }
  }

  const plan = config.plans[activePlanKey] || config.plans.free;

  return {
    activePlan: activePlanKey,
    planCode: plan?.planCode || 'free',
    features: plan?.features || config.plans.free?.features,
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
    const error = new Error(`Daily free message limit reached. You can send up to ${dailyLimit} messages per day on the Free plan.`);
    error.statusCode = 429;
    error.code = 'DAILY_MESSAGE_LIMIT_REACHED';
    error.meta = {
      dailyLimit,
      usedToday,
      remainingToday: 0,
      activePlan: entitlements.activePlan,
      features: entitlements.features,
      upgradeRequired: true,
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

export const createPremiumOrder = async (userId, planCode) => {
  const config = await getBaseConfig();
  
  // Find the plan by planCode or use premium as default
  let selectedPlan = config.plans.premium;
  if (planCode) {
    for (const [key, plan] of Object.entries(config.plans)) {
      if (plan.planCode === planCode || key === planCode) {
        selectedPlan = plan;
        break;
      }
    }
  }
  
  if (!selectedPlan) {
    selectedPlan = config.plans.premium;
  }

  const amountInPaise = Math.round((selectedPlan.priceInr || 0) * 100);
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
      planCode: selectedPlan.planCode,
      durationDays: String(selectedPlan.durationDays),
    },
  });

  await safeTrackPaymentEvent({
    userId,
    planCode: selectedPlan.planCode,
    razorpayOrderId: order.id,
    receipt: order.receipt || receipt,
    amountPaise: amountInPaise,
    currency: config.currency,
    status: 'order_created',
    source: 'client_order',
    rawPayload: order,
  });

  return {
    keyId: env.razorpay.keyId,
    order,
    plan: {
      planCode: selectedPlan.planCode,
      displayName: selectedPlan.displayName,
      amountInr: selectedPlan.priceInr,
      amountInPaise,
      currency: config.currency,
      durationDays: selectedPlan.durationDays,
      features: selectedPlan.features,
    },
  };
};

export const verifyAndActivatePremium = async (userId, payload, planCode) => {
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
    await safeTrackPaymentEvent({
      userId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'verification_failed',
      source: 'client_verify',
      verificationMethod: 'signature',
      rawPayload: payload,
      metadata: { reason: 'invalid_signature' },
    });

    const err = new Error('Invalid Razorpay signature');
    err.statusCode = 400;
    throw err;
  }

  const activation = await activatePremiumSubscription({
    userId,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    source: 'client_verify',
    planCode,
  });

  const config = await getBaseConfig();
  await safeTrackPaymentEvent({
    userId,
    planCode: activation?.subscription?.planCode || config.plans.premium?.planCode,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    amountPaise: activation?.subscription?.amountInPaise,
    currency: activation?.subscription?.currency,
    status: activation?.alreadyActivated ? 'verified_already_active' : 'verified_activated',
    source: 'client_verify',
    verificationMethod: 'signature',
    rawPayload: payload,
    metadata: {
      alreadyActivated: Boolean(activation?.alreadyActivated),
      expiresAt: activation?.subscription?.expiresAt || null,
    },
  });

  return activation;
};

export const processRazorpayWebhook = async ({ rawBody, signature }) => {
  const webhookSecret = env.razorpay.webhookSecret;
  if (!webhookSecret) {
    const err = new Error('Razorpay webhook secret is not configured');
    err.statusCode = 500;
    throw err;
  }

  if (!rawBody || !signature) {
    const err = new Error('Missing webhook payload or signature');
    err.statusCode = 400;
    throw err;
  }

  const computedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (computedSignature !== signature) {
    const err = new Error('Invalid Razorpay webhook signature');
    err.statusCode = 400;
    throw err;
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const eventType = event?.event;
  const paymentEntity = event?.payload?.payment?.entity;

  if (eventType !== 'payment.captured' || !paymentEntity?.order_id || !paymentEntity?.id) {
    await safeTrackPaymentEvent({
      razorpayOrderId: paymentEntity?.order_id ? String(paymentEntity.order_id) : undefined,
      razorpayPaymentId: paymentEntity?.id ? String(paymentEntity.id) : undefined,
      amountPaise: Number.isFinite(paymentEntity?.amount) ? paymentEntity.amount : undefined,
      currency: paymentEntity?.currency,
      status: 'event_ignored',
      source: 'webhook',
      eventType,
      rawPayload: event,
      metadata: { reason: 'EVENT_IGNORED' },
    });

    return {
      processed: false,
      reason: 'EVENT_IGNORED',
      eventType,
    };
  }

  const orderId = String(paymentEntity.order_id);
  const paymentId = String(paymentEntity.id);

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.fetch(orderId);
  const userIdRaw = order?.notes?.userId;
  const userId = Number(userIdRaw);

  if (!Number.isFinite(userId) || userId <= 0) {
    const err = new Error('Unable to resolve user from Razorpay order notes');
    err.statusCode = 400;
    throw err;
  }

  const activation = await activatePremiumSubscription({
    userId,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    source: 'webhook',
  });

  await safeTrackPaymentEvent({
    userId,
    planCode: order?.notes?.planCode || activation?.subscription?.planCode,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    receipt: order?.receipt,
    amountPaise: Number.isFinite(paymentEntity?.amount) ? paymentEntity.amount : undefined,
    currency: paymentEntity?.currency || order?.currency,
    status: paymentEntity?.status || 'captured',
    source: 'webhook',
    eventType,
    rawPayload: event,
    metadata: {
      alreadyActivated: Boolean(activation?.alreadyActivated),
      orderStatus: order?.status || null,
    },
  });

  return {
    processed: true,
    eventType,
    userId,
    alreadyActivated: activation.alreadyActivated,
  };
};
