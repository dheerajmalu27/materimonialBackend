import express from 'express';
import * as master from './master.controller.js';
import { authGuard } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /v1/master/religions:
 *   get:
 *     summary: Get list of available religions for filters
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Religions retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "hindu"
 *                       name:
 *                         type: string
 *                         example: "Hindu"
 */
router.get('/religions', master.getReligions);

/**
 * @swagger
 * /v1/master/castes:
 *   get:
 *     summary: Get list of available castes/communities for filters
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Castes retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "brahmin"
 *                       name:
 *                         type: string
 *                         example: "Brahmin"
 */
router.get('/castes', master.getCastes);

/**
 * @swagger
 * /v1/master/education:
 *   get:
 *     summary: Get list of available education levels for filters
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Education levels retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "bachelors"
 *                       name:
 *                         type: string
 *                         example: "Bachelor's Degree"
 */
router.get('/education', master.getEducationLevels);

/**
 * @swagger
 * /v1/master/occupations:
 *   get:
 *     summary: Get list of available occupations for filters
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Occupations retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "engineer"
 *                       name:
 *                         type: string
 *                         example: "Engineer"
 */
router.get('/occupations', master.getOccupations);

/**
 * @swagger
 * /v1/master/income-ranges:
 *   get:
 *     summary: Get list of available income ranges for filters
 *     tags: [Master Data]
 *     responses:
 *       200:
 *         description: Income ranges retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "3l_to_5l"
 *                       name:
 *                         type: string
 *                         example: "₹3,00,000 - ₹5,00,000"
 */
router.get('/income-ranges', master.getIncomeRanges);

export default router;
