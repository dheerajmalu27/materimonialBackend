// chat.routes.js
import express from 'express';
import * as chat from './chat.controller.js';
import * as chatValidation from './chat.validation.js';
import {authGuard} from '../../middlewares/auth.middleware.js';
import {validate} from '../../middlewares/validate.middleware.js';
import { requireMonetizationFeature } from '../../middlewares/monetization.middleware.js';

const router = express.Router();
/**
 * @swagger
 * /v1/messages/conversations:
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "conv_123"
 *                           participant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "user_456"
 *                               name:
 *                                 type: string
 *                                 example: "Jane Smith"
 *                               profileImage:
 *                                 type: string
 *                                 example: "https://example.com/images/user_456.jpg"
 *                               isOnline:
 *                                 type: boolean
 *                                 example: true
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "msg_789"
 *                               text:
 *                                 type: string
 *                                 example: "Hi! We matched!"
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-01-15T10:30:00Z"
 *                               isRead:
 *                                 type: boolean
 *                                 example: false
 *                           unreadCount:
 *                             type: integer
 *                             example: 2
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.post('/conversations', authGuard, requireMonetizationFeature('basicMessaging'), validate(chatValidation.createConversationSchema), chat.createConversation);

/**
 * @swagger
 * /v1/messages/conversations:
 *   get:
 *     summary: Get list of user conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                     conversations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "conv_123"
 *                           participant:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "user_456"
 *                               name:
 *                                 type: string
 *                                 example: "Jane Smith"
 *                               profileImage:
 *                                 type: string
 *                                 example: "https://example.com/images/user_456.jpg"
 *                               isOnline:
 *                                 type: boolean
 *                                 example: true
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "msg_789"
 *                               text:
 *                                 type: string
 *                                 example: "Hi! We matched!"
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-01-15T10:30:00Z"
 *                               isRead:
 *                                 type: boolean
 *                                 example: false
 *                           unreadCount:
 *                             type: integer
 *                             example: 2
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/conversations', authGuard, requireMonetizationFeature('basicMessaging'), chat.getConversations);

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
router.get('/chat/conversations/:id', authGuard, requireMonetizationFeature('basicMessaging'), validate(chatValidation.getConversationSchema), chat.getConversation);
router.delete('/conversations/:id', authGuard, requireMonetizationFeature('basicMessaging'), validate(chatValidation.deleteConversationSchema), chat.deleteConversation);

router.post('/messages', authGuard, requireMonetizationFeature('basicMessaging'), validate(chatValidation.sendMessageSchema), chat.sendMessage);

/**
 * @swagger
 * /v1/messages/conversations/{conversationId}:
 *   get:
 *     summary: Get messages for a specific conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *         example: "conv_123"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get messages before this message ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     conversationId:
 *                       type: string
 *                       example: "conv_123"
 *                     participant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user_456"
 *                         name:
 *                           type: string
 *                           example: "Jane Smith"
 *                         profileImage:
 *                           type: string
 *                           example: "https://example.com/images/user_456.jpg"
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "msg_785"
 *                           text:
 *                             type: string
 *                             example: "Hi, I saw your profile and thought we might be a good match!"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:00:00Z"
 *                           senderId:
 *                             type: string
 *                             example: "user_456"
 *                           isRead:
 *                             type: boolean
 *                             example: true
 *                     hasMore:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/conversations/:conversationId', authGuard, validate(chatValidation.getMessagesSchema), chat.getMessages);
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
