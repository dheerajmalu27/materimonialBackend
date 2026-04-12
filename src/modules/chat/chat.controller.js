// chat.controller.js
import * as service from './chat.service.js';
import presence from './presence.service.js';
import db from '../../models/index.js';
import { Op } from 'sequelize';
import { enforceMessageQuota } from '../monetization/monetization.service.js';

export const createConversation = async (req, res) => {
  const data = await service.createConversation(req.user.id, req.body.userId);
  res.json(data);
};

export const getConversations = async (req, res) => {
  const conversations = await service.getConversations(req.user.id);
  res.json({
    success: true,
    data: {
      conversations: conversations
    }
  });
};

export const getConversation = async (req, res) => {
  res.json(await service.getConversation(req.user.id, req.params.id));
};

export const deleteConversation = async (req, res) => {
  await service.deleteConversation(req.user.id, req.params.id);
  res.json({ success: true });
};

export const sendMessage = async (req, res) => {
  try {
    await enforceMessageQuota(req.user.id);
  } catch (error) {
    const isDailyLimitError = error?.code === 'DAILY_MESSAGE_LIMIT_REACHED';
    const dailyLimit = error?.meta?.dailyLimit;
    const usedToday = error?.meta?.usedToday;

    return res.status(error?.statusCode || 403).json({
      success: false,
      code: error?.code || (isDailyLimitError ? 'DAILY_MESSAGE_LIMIT_REACHED' : 'MESSAGE_LIMIT_REACHED'),
      message: isDailyLimitError
        ? `Daily free message limit reached (${usedToday}/${dailyLimit}). Upgrade to Premium for unlimited messaging.`
        : (error?.message || 'Unable to send message right now.'),
      data: {
        ...(error?.meta || {}),
        limitType: isDailyLimitError ? 'daily_free_messages' : 'unknown',
      },
    });
  }

  try {
    const message = await service.sendMessage(req.user.id, req.body);

    const payload = {
      id: `msg_${message.id}`,
      text: message.message,
      timestamp: message.sentAt,
      senderId: String(message.senderId),
      conversationId: String(message.conversationId),
      isRead: Boolean(message.isRead)
    };

    if (req.io) {
      req.io.to(`conversation_${message.conversationId}`).emit('receive-message', payload);
    }

    return res.json({
      success: true,
      data: {
        messageId: payload.id,
        text: payload.text,
        timestamp: payload.timestamp,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        isRead: payload.isRead
      }
    });
  } catch (error) {
    const isSequelizeValidationError = error?.name === 'SequelizeValidationError';
    const isSequelizeDatabaseError = error?.name === 'SequelizeDatabaseError';

    const validationErrors = Array.isArray(error?.errors)
      ? error.errors.map((item) => ({
          field: item?.path || null,
          message: item?.message || 'Validation failed',
          type: item?.type || null,
          value: item?.value ?? null,
        }))
      : [];

    return res.status(error?.statusCode || 500).json({
      success: false,
      code: isSequelizeValidationError
        ? 'MESSAGE_VALIDATION_FAILED'
        : isSequelizeDatabaseError
          ? 'MESSAGE_DATABASE_ERROR'
          : 'MESSAGE_SEND_FAILED',
      message: error?.message || 'Failed to send message',
      ...(validationErrors.length > 0 ? { errors: validationErrors } : {}),
      ...(isSequelizeDatabaseError
        ? {
            dbError: {
              detail: error?.original?.detail || null,
              hint: error?.original?.hint || null,
              constraint: error?.original?.constraint || null,
              column: error?.original?.column || null,
            },
          }
        : {}),
    });
  }
};

export const getMessages = async (req, res) => {
  const { limit = 50, before } = req.query;
  const { messages, hasMore } = await service.getMessages(req.user.id, req.params.conversationId, parseInt(limit), before);

  const userIdNum = parseInt(req.user.id, 10);
  const conversationIdNum = parseInt(req.params.conversationId, 10);

  const conversation = await db.Conversation.findOne({
    where: {
      id: conversationIdNum,
      [Op.or]: [{ user1Id: userIdNum }, { user2Id: userIdNum }]
    },
    include: [
      {
        model: db.User,
        as: 'user1',
        include: [{ model: db.UserProfile, as: 'profile' }]
      },
      {
        model: db.User,
        as: 'user2',
        include: [{ model: db.UserProfile, as: 'profile' }]
      }
    ]
  });

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  const otherUser = Number(conversation.user1Id) === userIdNum
    ? conversation.user2
    : conversation.user1;

  if (!otherUser) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  const transformedMessages = messages.map(msg => ({
    id: `msg_${msg.id}`,
    text: msg.message,
    timestamp: msg.sentAt,
    senderId: msg.senderId,
    isRead: msg.isRead
  }));

  res.json({
    success: true,
    data: {
      conversationId: `${conversationIdNum}`,
      participant: {
        id: `${otherUser.id}`,
        name: `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim() || 'Unknown',
        profileImage: otherUser.profile?.profileImage || null,
        mobile: otherUser.mobile || null,
        gender: otherUser.gender || null
      },
      messages: transformedMessages,
      hasMore
    }
  });
};

export const deleteMessage = async (req, res) => {
  await service.deleteMessage(req.user.id, req.params.id);
  res.json({ success: true });
};

export const markRead = async (req, res) => {
  await service.markRead(req.user.id, req.body.conversationId);
  res.json({ success: true });
};

export const unreadCount = async (req, res) => {
  res.json(await service.unreadCount(req.user.id));
};

export const typingStart = (req, res) => {
  presence.typingStart(req.user.id, req.body.conversationId);
  res.json({ typing: true });
};

export const typingStop = (req, res) => {
  presence.typingStop(req.user.id, req.body.conversationId);
  res.json({ typing: false });
};

export const onlineUsers = (req, res) => {
  res.json(presence.getOnlineUsers());
};
