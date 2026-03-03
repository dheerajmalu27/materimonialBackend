import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import educationRoutes from '../modules/education/education.routes.js';
import matchRoutes from '../modules/match/match.routes.js'
import partnerPreferenceRoutes from '../modules/partnerPreference/partnerPreference.routes.js';
import InteractactionRoutes from '../modules/interactions/interactions.routes.js';
import Chat from '../modules/chat/chat.routes.js'
import blocksRoutes from '../modules/blocks/blocks.routes.js';
import kundli from '../modules/kundli/kundli.routes.js';
import masterRoutes from '../modules/master/master.routes.js';
import monetizationRoutes from '../modules/monetization/monetization.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';

const router = Router();

// AUTH
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/education', educationRoutes);
router.use('/matches', matchRoutes);
router.use('/partner-preference', partnerPreferenceRoutes);
router.use('/interaction', InteractactionRoutes);
router.use('/messages', Chat);
router.use('/blocks', blocksRoutes);
router.use('/kundli', kundli);
router.use('/master', masterRoutes);
router.use('/monetization', monetizationRoutes);
router.use('/notifications', notificationRoutes);

// Example route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
  });
});

// Future routes
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/profiles', profileRoutes);

export default router;
