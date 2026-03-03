import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { registerPushToken } from './notification.controller.js';

const router = express.Router();

router.post('/push-token', authGuard, registerPushToken);

export default router;
