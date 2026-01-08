import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import * as interest from './interest.controller.js';
import * as shortlist from './shortlist.controller.js';
import * as profileView from './profileView.controller.js';

const router = express.Router();

/**
 * @swagger
 * /v1/interaction/interests/send:
 *   post:
 *     summary: Send interest to another user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID of the user to send interest to
 *                 example: 2
 *     responses:
 *       200:
 *         description: Interest sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     senderId:
 *                       type: integer
 *                       example: 1
 *                     receiverId:
 *                       type: integer
 *                       example: 2
 *                     status:
 *                       type: string
 *                       example: "sent"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T09:00:00Z"
 *       400:
 *         description: Bad request - Invalid receiver ID or already sent
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/interests/send', authGuard, interest.send);

/**
 * @swagger
 * /v1/interaction/interests/accept:
 *   post:
 *     summary: Accept a received interest
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *             properties:
 *               senderId:
 *                 type: integer
 *                 description: ID of the user who sent the interest
 *                 example: 2
 *     responses:
 *       200:
 *         description: Interest accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid sender ID or interest not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/interests/accept', authGuard, interest.accept);

/**
 * @swagger
 * /v1/interaction/interests/reject:
 *   post:
 *     summary: Reject a received interest
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *             properties:
 *               senderId:
 *                 type: integer
 *                 description: ID of the user who sent the interest
 *                 example: 2
 *     responses:
 *       200:
 *         description: Interest rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid sender ID or interest not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/interests/reject', authGuard, interest.reject);

/**
 * @swagger
 * /v1/interaction/interests/cancel:
 *   post:
 *     summary: Cancel a sent interest
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID of the user to whom interest was sent
 *                 example: 2
 *     responses:
 *       200:
 *         description: Interest cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid receiver ID or interest not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/interests/cancel', authGuard, interest.cancel);

/**
 * @swagger
 * /v1/interaction/interests/sent:
 *   get:
 *     summary: Get interests sent by the user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent interests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   senderId:
 *                     type: integer
 *                     example: 1
 *                   receiverId:
 *                     type: integer
 *                     example: 2
 *                   status:
 *                     type: string
 *                     example: "sent"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/interests/sent', authGuard, interest.sent);

/**
 * @swagger
 * /v1/interaction/interests/received:
 *   get:
 *     summary: Get interests received by the user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received interests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   senderId:
 *                     type: integer
 *                     example: 2
 *                   receiverId:
 *                     type: integer
 *                     example: 1
 *                   status:
 *                     type: string
 *                     example: "sent"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/interests/received', authGuard, interest.received);

/**
 * @swagger
 * /v1/interaction/interests/mutual:
 *   get:
 *     summary: Get mutual interests (accepted by both parties)
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mutual interests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   senderId:
 *                     type: integer
 *                     example: 2
 *                   receiverId:
 *                     type: integer
 *                     example: 1
 *                   status:
 *                     type: string
 *                     example: "accepted"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/interests/mutual', authGuard, interest.mutual);

/**
 * @swagger
 * /v1/interaction/shortlists:
 *   post:
 *     summary: Add a user to shortlist
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to add to shortlist
 *                 example: 2
 *     responses:
 *       200:
 *         description: User added to shortlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid user ID or already in shortlist
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/shortlists', authGuard, shortlist.add);

/**
 * @swagger
 * /v1/interaction/shortlists/{id}:
 *   delete:
 *     summary: Remove a user from shortlist
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shortlist entry ID to remove
 *         example: 1
 *     responses:
 *       200:
 *         description: User removed from shortlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid shortlist ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Shortlist entry not found
 *       500:
 *         description: Internal server error
 */
router.delete('/shortlists/:id', authGuard, shortlist.remove);

/**
 * @swagger
 * /v1/interaction/shortlists:
 *   get:
 *     summary: Get user's shortlist
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shortlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   userId:
 *                     type: integer
 *                     example: 1
 *                   shortlistedUserId:
 *                     type: integer
 *                     example: 2
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/shortlists', authGuard, shortlist.list);

/**
 * @swagger
 * /v1/interaction/profile-views:
 *   post:
 *     summary: Record a profile view
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user whose profile was viewed
 *                 example: 2
 *     responses:
 *       200:
 *         description: Profile view recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid user ID
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/profile-views', authGuard, profileView.view);

/**
 * @swagger
 * /v1/interaction/profile-views:
 *   get:
 *     summary: Get profile views for the user
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile views retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   viewerId:
 *                     type: integer
 *                     example: 2
 *                   viewedUserId:
 *                     type: integer
 *                     example: 1
 *                   viewedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/profile-views', authGuard, profileView.list);

export default router;
