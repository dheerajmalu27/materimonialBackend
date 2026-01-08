import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { checkMatch } from './kundli.controller.js';

const router = express.Router();

router.get('/match/:targetUserId', authGuard, checkMatch);

export default router;
