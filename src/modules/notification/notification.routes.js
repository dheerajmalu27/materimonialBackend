import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { registerFCMToken } from './notification.controller.js';

const router = express.Router();

router.post('/push-token', authGuard, registerFCMToken);

export default router;
