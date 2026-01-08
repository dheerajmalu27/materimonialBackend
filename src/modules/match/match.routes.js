import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import { getMatches } from './match.controller.js';

const router = express.Router();

/**
 * @swagger
 * /v1/match/suggestions:
 *   get:
 *     summary: Get match suggestions for the current user
 *     tags: [Match]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Match suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       email:
 *                         type: string
 *                         example: "user2@example.com"
 *                       mobile:
 *                         type: string
 *                         example: "+1234567891"
 *                       gender:
 *                         type: string
 *                         example: "female"
 *                       profile:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 2
 *                           firstName:
 *                             type: string
 *                             example: "Jane"
 *                           lastName:
 *                             type: string
 *                             example: "Smith"
 *                           dob:
 *                             type: string
 *                             format: date
 *                             example: "1992-05-15"
 *                           heightCm:
 *                             type: integer
 *                             example: 165
 *                           weightKg:
 *                             type: integer
 *                             example: 55
 *                           maritalStatus:
 *                             type: string
 *                             example: "never_married"
 *                           religion:
 *                             type: string
 *                             example: "Hindu"
 *                           caste:
 *                             type: string
 *                             example: "Brahmin"
 *                           motherTongue:
 *                             type: string
 *                             example: "Hindi"
 *                           aboutMe:
 *                             type: string
 *                             example: "I am a software engineer looking for a life partner."
 *                       addresses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             addressType:
 *                               type: string
 *                               enum: [present, permanent, both]
 *                               example: "present"
 *                             city:
 *                               type: string
 *                               example: "Delhi"
 *                             state:
 *                               type: string
 *                               example: "Delhi"
 *                             country:
 *                               type: string
 *                               example: "India"
 *                             pincode:
 *                               type: string
 *                               example: "110001"
 *                       education:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 2
 *                             highestDegree:
 *                               type: string
 *                               example: "Bachelor of Technology"
 *                             college:
 *                               type: string
 *                               example: "IIT Delhi"
 *                             specialization:
 *                               type: string
 *                               example: "Computer Science"
 *                             passingYear:
 *                               type: integer
 *                               example: 2014
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/suggestions', authGuard, getMatches);

export default router;
