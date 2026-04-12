import {
  createPremiumOrder,
  getMonetizationConfig,
  processRazorpayWebhook,
  getTodayInterestUsage,
  getUserEntitlements,
  verifyAndActivatePremium,
} from './monetization.service.js';

const handleError = (res, error) => {
  const statusCode = error?.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong',
    ...(error.code ? { code: error.code } : {}),
    ...(error.meta ? { data: error.meta } : {}),
  });
};

export const getConfig = async (req, res) => {
  try {
    const config = getMonetizationConfig();
    const entitlements = await getUserEntitlements(req.user.id);
    const usedToday = await getTodayInterestUsage(req.user.id);

    return res.json({
      success: true,
      data: {
        config,
        user: {
          ...entitlements,
          usage: {
            interestsSentToday: usedToday,
          },
        },
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createOrder = async (req, res) => {
  try {
    const result = await createPremiumOrder(req.user.id);
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const result = await verifyAndActivatePremium(req.user.id, req.body);
    return res.json({
      success: true,
      data: result,
      message: 'Premium subscription activated successfully',
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.get('x-razorpay-signature');
    const result = await processRazorpayWebhook({
      rawBody: req.body,
      signature,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
