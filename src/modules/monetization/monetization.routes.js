import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { createOrder, getConfig, handleRazorpayWebhook, verifyPayment } from './monetization.controller.js';

const router = express.Router();

router.get('/config', authGuard, getConfig);
router.post('/payments/razorpay/order', authGuard, createOrder);
router.post('/payments/razorpay/verify', authGuard, verifyPayment);
router.post('/payments/razorpay/webhook', handleRazorpayWebhook);

export default router;
