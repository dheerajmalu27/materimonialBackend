// chat.service.js
import db from '../../models/index.js';
const { Conversation, Message, Sequelize } = db;
import { Op } from 'sequelize';
/* CREATE / FIND CONVERSATION */
export const createConversation = async (userId, otherUserId) => {
  const [conv] = await Conversation.findOrCreate({
    where: {
      [Op.or]: [
        { user1Id: userId, user2Id: otherUserId },
        { user1Id: otherUserId, user2Id: userId }
      ]
    },
    defaults: {
      user1Id: userId,
      user2Id: otherUserId
    }
  });

  return conv;
};

/* LIST CONVERSATIONS */
export const getConversations = (userId) =>
  Conversation.findAll({
    where: {
      [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
    },
    order: [['created_at', 'DESC']]
  });

/* SINGLE CONVERSATION */
export const getConversation = (userId, id) =>
  Conversation.findOne({
    where: {
      id,
      [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
    }
  });

/* DELETE CONVERSATION */
export const deleteConversation = async (userId, id) => {
  await Message.destroy({ where: { conversationId: id } });
  await Conversation.destroy({ where: { id } });
};

/* SEND MESSAGE */
export const sendMessage = async (senderId, data) => {
  return Message.create({
    conversationId: data.conversationId,
    senderId,
    message: data.message,
    sentAt: new Date()
  });
};

/* GET MESSAGES */
export const getMessages = (userId, conversationId) =>
  Message.findAll({
    where: { conversationId },
    order: [['sent_at', 'ASC']]
  });

/* DELETE MESSAGE */
export const deleteMessage = async (userId, id) => {
  await Message.destroy({ where: { id, senderId: userId } });
};

/* MARK READ */
export const markRead = async (userId, conversationId) => {
  await Message.update(
    { isRead: true },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userId }
      }
    }
  );
};

/* UNREAD COUNT */
export const unreadCount = async (userId) => {
  return Message.count({
    where: {
      isRead: false,
      senderId: { [Op.ne]: userId }
    }
  });
};
