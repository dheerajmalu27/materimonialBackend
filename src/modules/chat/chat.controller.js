// chat.controller.js
import * as service from './chat.service.js';
import presence from './presence.service.js';

export const createConversation = async (req, res) => {
  const data = await service.createConversation(req.user.id, req.body.userId);
  res.json(data);
};

export const getConversations = async (req, res) => {
  res.json(await service.getConversations(req.user.id));
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
  res.json(await service.getMessages(req.user.id, req.params.conversationId));
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
