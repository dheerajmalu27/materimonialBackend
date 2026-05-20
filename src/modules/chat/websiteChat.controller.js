import * as service from './websiteChat.service.js';

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const listConversations = async (req, res) => {
  const limit = toInt(req.query.limit, 20);
  const offset = toInt(req.query.offset, 0);

  const data = await service.getWebsiteConversations(req.user.id, { limit, offset });
  return res.json({
    success: true,
    data: {
      items: data.items,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    },
  });
};

export const getConversationMessages = async (req, res) => {
  const limit = toInt(req.query.limit, 50);
  const offset = toInt(req.query.offset, 0);
  const before = req.query.before || undefined;

  const data = await service.getWebsiteConversationMessages(req.user.id, req.params.conversationId, {
    limit,
    offset,
    before,
  });

  return res.json({
    success: true,
    data: {
      conversationId: `${req.params.conversationId}`,
      messages: data.messages,
      pagination: { limit: data.limit, offset: data.offset },
    },
  });
};

export const sendMessage = async (req, res) => {
  const { message } = req.body || {};
  const data = await service.sendWebsiteMessage(req.user.id, req.params.conversationId, { message });

  return res.json({ success: true, messageId: data.messageId });
};

export const markRead = async (req, res) => {
  const { upToMessageId } = req.body || {};
  const data = await service.markWebsiteRead(req.user.id, req.params.conversationId, { upToMessageId });

  return res.json({ success: true, readUpToMessageId: data.readUpToMessageId });
};

