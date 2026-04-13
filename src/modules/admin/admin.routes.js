import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  adminLogin,
  getStats,
  getUsers,
  toggleUserBlock,
  approveUserProfile,
  deleteUser,
  getUserDetail,
  getSubscriptionPlans,
  createSubscriptionPlan,
  getSubscriptionUsers,
  getPayments,
  getContentPhotos,
  approvePhoto,
  rejectPhoto,
  getReports,
  getMatchAnalytics,
  getUserAnalytics,
  getRevenueAnalytics,
  getCommsLogs,
  getCommsConversation,
  getSettings,
  updateSettings,
} from './admin.controller.js';

import { validate } from '../../middlewares/validate.middleware.js';
import { adminLoginSchema, photoActionSchema, settingsSchema} from './admin.validation.js';
import { adminGuard } from '../../middlewares/admin.middleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: { success: false, message: 'Too many login attempts' },
});

router.post('/login', loginLimiter, validate(adminLoginSchema), adminLogin);
router.get('/stats', adminGuard, getStats);

router.get('/users', adminGuard, getUsers);
router.patch('/users/:id/block', adminGuard, toggleUserBlock);
router.patch('/users/:id/approve', adminGuard, approveUserProfile);
router.delete('/users/:id', adminGuard, deleteUser);
router.get('/users/:id', adminGuard, getUserDetail);

router.get('/subscriptions/plans', adminGuard, getSubscriptionPlans);
router.post('/subscriptions/plans', adminGuard, createSubscriptionPlan);
router.get('/subscriptions/users', adminGuard, getSubscriptionUsers);
router.get('/payments', adminGuard, getPayments);

router.get('/content/photos', adminGuard, getContentPhotos);
router.patch('/content/photos/:id/approve', adminGuard, approvePhoto);
router.patch('/content/photos/:id/reject', adminGuard, validate(photoActionSchema), rejectPhoto);
router.get('/reports', adminGuard, getReports);

router.get('/analytics/matches', adminGuard, getMatchAnalytics);
router.get('/analytics/users', adminGuard, getUserAnalytics);
router.get('/analytics/revenue', adminGuard, getRevenueAnalytics);

router.get('/comms/logs', adminGuard, getCommsLogs);
router.get('/comms/conversations/:convId', adminGuard, getCommsConversation);

router.get('/settings', adminGuard, getSettings);
router.patch('/settings', adminGuard, validate(settingsSchema), updateSettings);

export default router;

