import express from 'express';
import { saveMyEducation, getMyEducationController, deleteMyEducationController } from './education.controller.js';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as educationValidation from './education.validation.js';

const router = express.Router();

/**
 * @swagger
 * /v1/education/me:
 *   get:
 *     summary: Get user's education details
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Education details retrieved successfully
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
 *                     qualification:
 *                       type: string
 *                       example: "Bachelor of Technology"
 *                     college:
 *                       type: string
 *                       example: "ABC Engineering College"
 *                     university:
 *                       type: string
 *                       example: "XYZ University"
 *                     passingYear:
 *                       type: integer
 *                       example: 2020
 *                     highest:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T09:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T09:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/me', authGuard, getMyEducationController);

/**
 * @swagger
 * /v1/education/me:
 *   post:
 *     summary: Add or update user's education details
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qualification
 *               - college
 *             properties:
 *               qualification:
 *                 type: string
 *                 maxLength: 100
 *                 description: Educational qualification
 *                 example: "Bachelor of Technology"
 *               college:
 *                 type: string
 *                 maxLength: 150
 *                 description: College name
 *                 example: "ABC Engineering College"
 *               university:
 *                 type: string
 *                 maxLength: 150
 *                 description: University name
 *                 example: "XYZ University"
 *               passingYear:
 *                 type: integer
 *                 minimum: 1950
 *                 maximum: 2024
 *                 description: Year of passing
 *                 example: 2020
 *               highest:
 *                 type: boolean
 *                 description: Whether this is the highest qualification
 *                 example: true
 *     responses:
 *       200:
 *         description: Education details saved successfully
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
 *                   example: "Education details saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     qualification:
 *                       type: string
 *                       example: "Bachelor of Technology"
 *                     college:
 *                       type: string
 *                       example: "ABC Engineering College"
 *                     university:
 *                       type: string
 *                       example: "XYZ University"
 *                     passingYear:
 *                       type: integer
 *                       example: 2020
 *                     highest:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T09:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-01T09:00:00Z"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/me', authGuard, validate(educationValidation.upsertEducationSchema), saveMyEducation);

/**
 * @swagger
 * /v1/education/me:
 *   delete:
 *     summary: Delete user's education details
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Education details deleted successfully
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
 *                   example: "Education details deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Education details not found
 *       500:
 *         description: Internal server error
 */
router.delete('/me', authGuard, deleteMyEducationController);

export default router;
