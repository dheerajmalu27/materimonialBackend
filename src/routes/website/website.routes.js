import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';

// Reuse existing controllers/services by calling the same logic from modules.
import * as websiteRequestsController from '../../modules/interactions/websiteRequests.controller.js';
import * as websiteShortlistController from '../../modules/interactions/websiteShortlist.controller.js';

import * as chatController from '../../modules/chat/chat.controller.js';
import * as websiteChatController from '../../modules/chat/websiteChat.controller.js';
import * as websiteSettingsController from '../../modules/user/websiteSettings.controller.js';
import * as uc from '../../modules/user/user.controller.js';
import { getPotentialMatches } from '../../modules/match/match.controller.js';



const router = express.Router();

/**
 * Requests
 * Website API expects `requestId` to be `interests.id`.
 */
router.get('/requests/sent', authGuard, websiteRequestsController.sent);
router.get('/requests/received', authGuard, websiteRequestsController.received);

// Send interest
// Contract: POST /website/requests/send body { receiverId }
import * as websiteInterestController from '../../modules/interactions/interest.controller.js';
router.post('/requests/send', authGuard, websiteInterestController.send);

// Accept / Reject by interestId requires controller-level support.
// We implement thin mapping by resolving sender/receiver from interest model.
import Interest from '../../models/interest.model.js';

const updateInterestById = async (req, res, status) => {
  const { requestId } = req.params;
  const interest = await Interest.findOne({ where: { id: requestId } });
  if (!interest) return res.status(404).json({ success: false, message: 'Interest not found' });

  // Only receiver can accept/reject.
  if (String(interest.receiverId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await Interest.update({ status }, { where: { id: requestId } });
  return res.json({ success: true, status });
};

router.post('/requests/:requestId/accept', authGuard, (req, res) => updateInterestById(req, res, 'accepted'));
router.post('/requests/:requestId/reject', authGuard, (req, res) => updateInterestById(req, res, 'rejected'));
router.post('/requests/:requestId/cancel', authGuard, async (req, res) => {
  const { requestId } = req.params;
  const interest = await Interest.findOne({ where: { id: requestId } });
  if (!interest) return res.status(404).json({ success: false, message: 'Interest not found' });

  // Only sender can cancel.
  if (String(interest.senderId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  await Interest.update({ status: 'cancelled' }, { where: { id: requestId } });
  return res.json({ success: true, status: 'cancelled' });
});

/**
 * Shortlists
 */
router.get('/shortlists', authGuard, websiteShortlistController.list);

// Add shortlist for website (userId -> shortlistedUserId)
// Body: { userId: number }
router.post('/shortlists', authGuard, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

  // Reuse module/service logic: controller currently exposes `list` and `remove` only.
  // So we directly call the shortlist service via the DB model.
  const Shortlist = (await import('../../models/shortlist.model.js')).default;
  await Shortlist.findOrCreate({
    where: { userId: req.user.id, shortlistedUserId: userId },
    defaults: { userId: req.user.id, shortlistedUserId: userId }
  });
  return res.json({ success: true });
});


// Remove shortlist by shortlistedUserId
router.delete('/shortlists/:shortlistedUserId', authGuard, async (req, res) => {
  const { shortlistedUserId } = req.params;

  // Resolve shortlist row id to reuse controller
  const Shortlist = (await import('../../models/shortlist.model.js')).default;
  const entry = await Shortlist.findOne({ where: { userId: req.user.id, shortlistedUserId } });
  if (!entry) return res.status(404).json({ success: false, message: 'Shortlist entry not found' });

  await Shortlist.destroy({ where: { id: entry.id, userId: req.user.id } });
  return res.json({ success: true });
});


/**
 * Messages
 */
router.post('/messages/conversations', authGuard, chatController.createConversation);
router.get('/messages/conversations', authGuard, chatController.getConversations);
router.get('/messages/conversations/:conversationId', authGuard, websiteChatController.getConversationMessages);
router.post('/messages/conversations/:conversationId/read', authGuard, async (req, res) => {
// website contract: body { upToMessageId }
  await websiteChatController.markRead(req, res);
});
router.post('/messages/conversations/:conversationId/messages', authGuard, websiteChatController.sendMessage);
router.get('/messages/unread-count', authGuard, chatController.unreadCount);

/**
 * Match potential (same logic as /v1/matches/potential)
 */
router.get('/matches/potential', authGuard, getPotentialMatches);

/**
 * User profile (same logic as /v1/user/me/profile)
 */
router.get('/me/profile', authGuard, uc.getMyProfile);

/**
 * Settings
 */

router.get('/users/me/settings', authGuard, websiteSettingsController.getMyWebsiteSettings);
router.put('/users/me/settings', authGuard, websiteSettingsController.updateMyWebsiteSettings);

export default router;


