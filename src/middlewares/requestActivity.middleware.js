import { buildApiAction, logActivity } from '../utils/activityLogger.js';

const DEFAULT_IGNORE_SEGMENTS = [
  '/health',
  '/users/me/activity',
  '/monetization/payments/razorpay/webhook',
];

const shouldIgnore = (req, ignoreSegments) => {
  const path = String(req?.originalUrl || req?.path || '').split('?')[0].toLowerCase();
  return ignoreSegments.some((segment) => path.includes(segment));
};

export const requestActivityMiddleware = ({
  ignoreSegments = DEFAULT_IGNORE_SEGMENTS,
  logOnlyAuthenticated = true,
} = {}) => {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', async () => {
      if (req.__activityLogged) return;
      if (shouldIgnore(req, ignoreSegments)) return;
      if (logOnlyAuthenticated && !req.user?.id) return;

      const action = buildApiAction(req);
      const durationMs = Math.max(0, Date.now() - startedAt);

      await logActivity({
        userId: req.user?.id,
        action,
        description: {
          type: 'api_request',
          method: req.method,
          path: String(req.originalUrl || req.path || '').split('?')[0],
          statusCode: res.statusCode,
          durationMs,
        },
        req,
      });
    });

    next();
  };
};
