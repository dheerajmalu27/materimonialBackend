import { getUserEntitlements } from '../modules/monetization/monetization.service.js';

const deny = (res, featureKey, entitlements) => {
  return res.status(403).json({
    success: false,
    code: 'FEATURE_NOT_AVAILABLE',
    message: `Feature not available for current plan: ${featureKey}`,
    data: {
      activePlan: entitlements.activePlan,
      features: entitlements.features,
      requiredFeature: featureKey,
    },
  });
};

const hasFeatureAccess = (entitlements, featureKey) => {
  if (entitlements.activePlan === 'premium') return true;

  const features = entitlements.features || {};

  if (featureKey === 'basicSearch') {
    return Boolean(features.limitedSearch || features.advancedSearch);
  }

  if (featureKey === 'advancedSearch') {
    return Boolean(features.advancedSearch);
  }

  if (featureKey === 'basicMessaging') {
    return Boolean(features.basicMessaging);
  }

  return Boolean(features[featureKey]);
};

export const requireMonetizationFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const entitlements = await getUserEntitlements(req.user.id);

      if (!hasFeatureAccess(entitlements, featureKey)) {
        return deny(res, featureKey, entitlements);
      }

      req.monetization = entitlements;
      return next();
    } catch (error) {
      return res.status(error?.statusCode || 500).json({
        success: false,
        message: error?.message || 'Failed to evaluate plan entitlements',
      });
    }
  };
};
