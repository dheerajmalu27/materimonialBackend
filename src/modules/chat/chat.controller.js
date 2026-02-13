// chat.controller.js
import * as service from './chat.service.js';
import presence from './presence.service.js';
import db from '../../models/index.js';

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
  res.json(await service.sendMessage(req.user.id, req.body));
};

export const getMessages = async (req, res) => {
  const { limit = 50, before } = req.query;
  const { messages, hasMore } = await service.getMessages(req.user.id, req.params.conversationId, parseInt(limit), before);

  // Get conversation to verify access
  const conversation = await service.getConversation(req.user.id, req.params.conversationId);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  const userIdNum = parseInt(req.user.id, 10);

  if (messages.length === 0) {
    return res.status(400).json({ success: false, message: 'No messages in conversation' });
  }

  const senderIds = [...new Set(messages.map(msg => msg.senderId))];
  const otherSenderIds = senderIds.filter(id => id !== userIdNum);

  if (otherSenderIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No other participant in messages' });
  }

  const otherUserId = otherSenderIds[0];

  // Fetch the other user's details
  const otherUser = await db.User.findOne({
    where: { id: otherUserId },
    include: [{ model: db.UserProfile, as: 'profile' }]
  });

  if (!otherUser) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  // Transform messages
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
      conversationId: `conv_${req.params.conversationId}`,
      participant: {
        id: otherUser.id,
        name: `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim() || 'Unknown',
        profileImage: otherUser.profile?.profileImage || null
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
