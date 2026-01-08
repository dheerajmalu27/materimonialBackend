import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import {
  addOrUpdatePartnerPreference,
  getMyPartnerPreference
} from './partnerPreference.controller.js';
const router = express.Router();

/**
 * @swagger
 * /v1/partner-preference/me:
 *   get:
 *     summary: Get current user's partner preferences
 *     tags: [Partner Preference]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner preferences retrieved successfully
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
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     minAge:
 *                       type: integer
 *                       example: 25
 *                     maxAge:
 *                       type: integer
 *                       example: 35
 *                     minHeightCm:
 *                       type: integer
 *                       example: 160
 *                     maxHeightCm:
 *                       type: integer
 *                       example: 180
 *                     religion:
 *                       type: string
 *                       example: "Hindu"
 *                     caste:
 *                       type: string
 *                       example: "Brahmin"
 *                     education:
 *                       type: string
 *                       example: "Bachelor's Degree"
 *                     city:
 *                       type: string
 *                       example: "Mumbai"
 *                     state:
 *                       type: string
 *                       example: "Maharashtra"
 *                     motherTongue:
 *                       type: string
 *                       example: "Hindi"
 *                     kundliMatchRequired:
 *                       type: boolean
 *                       example: true
 *                     manglikPreference:
 *                       type: string
 *                       enum: [yes, no, both]
 *                       example: "no"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me', authGuard, getMyPartnerPreference);

/**
 * @swagger
 * /v1/partner-preference/me:
 *   post:
 *     summary: Add or update partner preferences
 *     tags: [Partner Preference]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minAge:
 *                 type: integer
 *                 minimum: 18
 *                 example: 25
 *               maxAge:
 *                 type: integer
 *                 minimum: 18
 *                 example: 35
 *               minHeightCm:
 *                 type: integer
 *                 example: 160
 *               maxHeightCm:
 *                 type: integer
 *                 example: 180
 *               religion:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Hindu"
 *               caste:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Brahmin"
 *               education:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Bachelor's Degree"
 *               city:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Maharashtra"
 *               motherTongue:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Hindi"
 *               kundliMatchRequired:
 *                 type: boolean
 *                 example: true
 *               manglikPreference:
 *                 type: string
 *                 enum: [yes, no, both]
 *                 example: "no"
 *     responses:
 *       200:
 *         description: Partner preferences saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Partner preference saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     minAge:
 *                       type: integer
 *                       example: 25
 *                     maxAge:
 *                       type: integer
 *                       example: 35
 *                     minHeightCm:
 *                       type: integer
 *                       example: 160
 *                     maxHeightCm:
 *                       type: integer
 *                       example: 180
 *                     religion:
 *                       type: string
 *                       example: "Hindu"
 *                     caste:
 *                       type: string
 *                       example: "Brahmin"
 *                     education:
 *                       type: string
 *                       example: "Bachelor's Degree"
 *                     city:
 *                       type: string
 *                       example: "Mumbai"
 *                     state:
 *                       type: string
 *                       example: "Maharashtra"
 *                     motherTongue:
 *                       type: string
 *                       example: "Hindi"
 *                     kundliMatchRequired:
 *                       type: boolean
 *                       example: true
 *                     manglikPreference:
 *                       type: string
 *                       enum: [yes, no, both]
 *                       example: "no"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/me', authGuard, addOrUpdatePartnerPreference);

export default router;
