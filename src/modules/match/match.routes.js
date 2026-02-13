import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { getMatches, getPotentialMatches } from './match.controller.js';

const router = express.Router();

/**
 * @swagger
 * /v1/matches/potential:
 *   get:
 *     summary: Get list of potential matches for the user
 *     tags: [Match]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of matches to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city for My City page
 *     responses:
 *       200:
 *         description: Potential matches retrieved successfully
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
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "user_456"
 *                           name:
 *                             type: string
 *                             example: "Jane Smith"
 *                           age:
 *                             type: integer
 *                             example: 26
 *                           location:
 *                             type: string
 *                             example: "Pune, India"
 *                           occupation:
 *                             type: string
 *                             example: "Doctor"
 *                           bio:
 *                             type: string
 *                             example: "Passionate about helping others and finding true love"
 *                           religion:
 *                             type: string
 *                             example: "Hindu"
 *                           caste:
 *                             type: string
 *                             example: "Kayasth"
 *                           height:
 *                             type: string
 *                             example: "5'4\""
 *                           education:
 *                             type: string
 *                             example: "MBBS"
 *                           profileImage:
 *                             type: string
 *                             example: "https://example.com/images/user_456.jpg"
 *                           compatibilityScore:
 *                             type: integer
 *                             example: 85
 *                           isVerified:
 *                             type: boolean
 *                             example: true
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-14T15:30:00Z"
 *                     totalCount:
 *                       type: integer
 *                       example: 150
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/potential', authGuard, getPotentialMatches);

export default router;
