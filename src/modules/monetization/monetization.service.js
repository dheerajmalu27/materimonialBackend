import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Op, fn, col, where } from 'sequelize';
import { env } from '../../config/env.js';
import Interest from '../../models/interest.model.js';
import Message from '../../models/message.model.js';
import PaymentTransaction from '../../models/paymentTransaction.model.js';
import UserActivity from '../../models/userActivity.model.js';
import { logActivity } from '../../utils/activityLogger.js';

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
}) => {
  const existingActivation = await findActivationByPaymentId(userId, razorpayPaymentId);
  if (existingActivation) {
    const subscription = getPlanFromActivity(existingActivation);
    return {
      success: true,
      alreadyActivated: true,
      subscription,
      features: getBaseConfig().plans.premium.features,
    };
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
    razorpayOrderId,
    razorpayPaymentId,
    activatedVia: source,
  };

  await logActivity({
    userId,
    action: 'subscription_activated',
    description,
  });

  return {
    success: true,
    alreadyActivated: false,
    subscription: description,
    features: premiumPlan.features,
  };
};

export const getMonetizationConfig = () => {
  return getBaseConfig();
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

  await safeTrackPaymentEvent({
    userId,
    planCode: premiumPlan.planCode,
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
  });

  await safeTrackPaymentEvent({
    userId,
    planCode: activation?.subscription?.planCode || getBaseConfig().plans.premium.planCode,
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
