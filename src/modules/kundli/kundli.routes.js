import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { checkMatch } from './kundli.controller.js';

const router = express.Router();

/**
 * @swagger
 * /v1/kundli/match/{targetUserId}:
 *   get:
 *     summary: Get kundli compatibility score with another user
 *     deprecated: true
 *     tags: [Kundli]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Target user ID
 *     responses:
 *       200:
 *         description: Kundli compatibility calculated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.get('/match/:targetUserId', authGuard, checkMatch);

export default router;
