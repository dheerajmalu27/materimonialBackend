import db from '../../models/index.js';
import { Op } from 'sequelize';

import * as chatService from './chat.service.js';

const { Conversation, Message } = db;

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const getWebsiteConversations = async (userId, { limit = 20, offset = 0 } = {}) => {
  // Reuse existing conversation list then page in-memory (MVP).
  const all = await chatService.getConversations(userId);
  const start = Math.max(0, offset);
  const end = start + Math.max(1, limit);

  const items = all.slice(start, end).map((c) => ({
    conversationId: c.id,
    otherUser: c.participant,
    unreadCount: c.unreadCount ?? 0,
    pinned: false,
    favorite: false,
    lastMessage: c.lastMessage
      ? {
          messageId: c.lastMessage.id,
          message: c.lastMessage.text,
          sentAt: c.lastMessage.timestamp,
          senderId: `${c.lastMessage.senderId ?? ''}`,
        }
      : null,
    lastMessageRead: c.lastMessage ? Boolean(c.lastMessage.isRead) : true,
  }));

  return {
    items,
    total: all.length,
    limit: Math.max(1, limit),
    offset: start,
  };
};

export const getWebsiteConversationMessages = async (userId, conversationId, { limit = 50, offset = 0, before } = {}) => {
  // Existing getMessages supports { limit, before } but not offset; we keep offset as pass-through for MVP.
  const res = await chatService.getMessages(userId, conversationId, limit, before);

  // Convert messages to contract shape (readByMe is best-effort using Message.isRead).
  const messages = (res.messages || []).map((msg) => ({
    messageId: `${msg.id}`,
    senderId: `${msg.senderId}`,
    text: msg.message,
    sentAt: msg.sentAt,
    readByMe: Boolean(msg.isRead),
  }));

  return {
    messages,
    hasMore: Boolean(res.hasMore),
    limit: Math.max(1, limit),
    offset: toInt(offset, 0),
  };
};

export const sendWebsiteMessage = async (userId, conversationId, { message } = {}) => {
  const payload = { conversationId, message };
  const msg = await chatService.sendMessage(userId, payload);
  return { messageId: msg.id };
};

export const markWebsiteRead = async (userId, conversationId, { upToMessageId } = {}) => {
  // Existing implementation marks messages from the other sender as read for the conversation.
  // Contract requires upToMessageId; MVP ignores ordering but returns it.
  await chatService.markRead(userId, conversationId);
  return { readUpToMessageId: upToMessageId ?? null };
};

