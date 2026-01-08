import { Router } from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import * as profileController from './profile.controller.js';

const router = Router();

/**
 * 🔐 All profile routes are PROTECTED
 */

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authGuard, profileController.getMyProfile);

/**
 * @swagger
 * /profile/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *           example:
 *             first_name: "John"
 *             last_name: "Doe"
 *             dob: "1990-01-01"
 *             birth_time: "12:00:00"
 *             height_cm: 175
 *             weight_kg: 70
 *             marital_status: "single"
 *             religion: "Hindu"
 *             caste: "Brahmin"
 *             mother_tongue: "Hindi"
 *             about_me: "I am a software engineer looking for a life partner."
 *             address:
 *               present:
 *                 city: "Mumbai"
 *                 state: "Maharashtra"
 *                 country: "India"
 *                 pincode: "400001"
 *               permanent:
 *                 city: "Delhi"
 *                 state: "Delhi"
 *                 country: "India"
 *                 pincode: "110001"
 *             education:
 *               highest_degree: "Bachelor of Engineering"
 *               college: "IIT Bombay"
 *               specialization: "Computer Science"
 *               passing_year: "2012"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/me', authGuard, profileController.updateMyProfile);

/**
 * @swagger
 * /profile/completion:
 *   get:
 *     summary: Get profile completion percentage
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileCompletionResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/completion', authGuard, profileController.getProfileCompletion);

export default router;
