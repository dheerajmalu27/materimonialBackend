import express from 'express';
import * as blocksController from './blocks.controller.js';
import * as blocksValidation from './blocks.validation.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authGuard } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /v1/blocks:
 *   post:
 *     summary: Block a user
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockedUserId
 *             properties:
 *               blockedUserId:
 *                 type: integer
 *                 description: ID of the user to block
 *             example:
 *               blockedUserId: 2
 *     responses:
 *       201:
 *         description: User blocked successfully
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
 *                   example: "User blocked successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BlockedUser'
 *       400:
 *         description: Bad request - Cannot block yourself
 *       404:
 *         description: User to block not found
 *       409:
 *         description: User is already blocked
 *       500:
 *         description: Internal server error
 */
 router.post('/', authGuard, validate(blocksValidation.blockUserSchema), blocksController.blockUser);

/**
 * @swagger
 * /v1/blocks/{id}:
 *   delete:
 *     summary: Unblock a user
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Block record ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User unblocked successfully
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
 *                   example: "User unblocked successfully"
 *       404:
 *         description: Block record not found
 *       500:
 *         description: Internal server error
 */
 router.delete('/:id', authGuard, validate(blocksValidation.unblockUserSchema), blocksController.unblockUser);

/**
 * @swagger
 * /v1/blocks:
 *   get:
 *     summary: Get list of blocked users
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlockedUserWithDetails'
 *       500:
 *         description: Internal server error
 */
 router.get('/', authGuard, blocksController.getBlockedUsers);

export default router;
