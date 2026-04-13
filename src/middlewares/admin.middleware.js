import { authGuard } from './auth.middleware.js';

export const adminGuard = (req, res, next) => {
  authGuard(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }
    next();
  });
};

