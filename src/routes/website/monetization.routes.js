import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';

// Expose monetization under WEBSITE routes (do not reuse native/mobile app paths)
import {
  getConfig,
  createOrder,
  verifyPayment,
} from '../../modules/monetization/monetization.controller.js';

const router = express.Router();

router.get('/subscription/plans', authGuard, getConfig);
router.post('/subscription/order', authGuard, createOrder);
router.post('/subscription/verify', authGuard, verifyPayment);

export default router;

