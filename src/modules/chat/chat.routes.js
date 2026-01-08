// chat.routes.js
import express from 'express';
import * as chat from './chat.controller.js';
import * as chatValidation from './chat.validation.js';
import {authGuard} from '../../middlewares/auth.middleware.js';
import {validate} from '../../middlewares/validate.middleware.js';

const router = express.Router();
/**
 * @swagger
 * /v1/chat/conversations:
 *   post:
 *     summary: Create a new conversation with another user
 *     tags: [Chat]
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
 *                 description: User ID of the other participant
 *                 example: 2
 *     responses:
 *       200:
 *         description: Conversation created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 user1Id:
 *                   type: integer
 *                   example: 1
 *                 user2Id:
 *                   type: integer
 *                   example: 2
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T09:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T09:00:00Z"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/conversations', authGuard, validate(chatValidation.createConversationSchema), chat.createConversation);

/**
 * @swagger
 * /v1/chat/conversations:
 *   get:
 *     summary: Get all conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                   user1Id:
 *                     type: integer
 *                     example: 1
 *                   user2Id:
 *                     type: integer
 *                     example: 2
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T09:00:00Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T10:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/conversations', authGuard, chat.getConversations);

/**
 * @swagger
 * /v1/chat/conversations/{id}:
 *   get:
 *     summary: Get a specific conversation by ID
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 user1Id:
 *                   type: integer
 *                   example: 1
 *                 user2Id:
 *                   type: integer
 *                   example: 2
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T09:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/conversations/:id', authGuard, validate(chatValidation.getConversationSchema), chat.getConversation);
router.delete('/conversations/:id', authGuard, validate(chatValidation.deleteConversationSchema), chat.deleteConversation);

router.post('/messages', authGuard, validate(chatValidation.sendMessageSchema), chat.sendMessage);

/**
 * @swagger
 * /v1/chat/messages/{conversationId}:
 *   get:
 *     summary: Get all messages in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Conversation ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 123
 *                   conversationId:
 *                     type: integer
 *                     example: 1
 *                   senderId:
 *                     type: integer
 *                     example: 1
 *                   message:
 *                     type: string
 *                     example: "Hello, how are you?"
 *                   sentAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T10:00:00Z"
 *                   isRead:
 *                     type: boolean
 *                     example: false
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/messages/:conversationId', authGuard, validate(chatValidation.getMessagesSchema), chat.getMessages);
/**
 * @swagger
 * /v1/chat/messages/{id}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *         example: 123
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - User is not the sender of the message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete('/messages/:id', authGuard, validate(chatValidation.deleteMessageSchema), chat.deleteMessage);

/**
 * @swagger
 * /v1/chat/messages/read:
 *   post:
 *     summary: Mark messages as read in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: integer
 *                 description: ID of the conversation
 *                 example: 1
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.post('/messages/read', authGuard, validate(chatValidation.markReadSchema), chat.markRead);

/**
 * @swagger
 * /v1/chat/messages/unread-count:
 *   get:
 *     summary: Get count of unread messages for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: integer
 *               example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/messages/unread-count', authGuard, chat.unreadCount);

/**
 * @swagger
 * /v1/chat/typing/start:
 *   post:
 *     summary: Start typing indicator in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: integer
 *                 description: ID of the conversation
 *                 example: 1
 *     responses:
 *       200:
 *         description: Typing indicator started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 typing:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/typing/start', authGuard, validate(chatValidation.typingStartSchema), chat.typingStart);

/**
 * @swagger
 * /v1/chat/typing/stop:
 *   post:
 *     summary: Stop typing indicator in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: integer
 *                 description: ID of the conversation
 *                 example: 1
 *     responses:
 *       200:
 *         description: Typing indicator stopped
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 typing:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/typing/stop', authGuard, validate(chatValidation.typingStopSchema), chat.typingStop);

/**
 * @swagger
 * /v1/chat/online-users:
 *   get:
 *     summary: Get list of online users
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Online users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 2
 *                   email:
 *                     type: string
 *                     example: "user2@example.com"
 *                   lastSeen:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T10:00:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/online-users', authGuard, chat.onlineUsers);

export default router;
