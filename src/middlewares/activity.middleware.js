import { logActivity } from '../utils/activityLogger.js';

export const activityMiddleware = (action, description) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode < 400 && req.user?.id) {
        await logActivity({
          userId: req.user.id,
          action,
          description,
          req,
          markRequestAsLogged: true,
        });
      }
    });

    next();
  };
};
