// chat.service.js
import db from '../../models/index.js';
const { Conversation, Message, User, UserProfile, UserProfession, Sequelize } = db;
import { Op } from 'sequelize';
/* CREATE / FIND CONVERSATION */
export const createConversation = async (userId, otherUserId) => {
  const userIdNum = parseInt(userId, 10);
  const otherUserIdNum = parseInt(otherUserId, 10);

  if (userIdNum === otherUserIdNum) {
    throw new Error('Cannot create conversation with self');
  }

  const [conv] = await Conversation.findOrCreate({
    where: {
      [Op.or]: [
        { user1Id: userIdNum, user2Id: otherUserIdNum },
        { user1Id: otherUserIdNum, user2Id: userIdNum }
      ]
    },
    defaults: {
      user1Id: userIdNum,
      user2Id: otherUserIdNum
    }
  });

  return conv;
};

/* LIST CONVERSATIONS */
export const getConversations = async (userId) => {
  // Convert userId to number to match database IDs
  const userIdNum = parseInt(userId, 10);
  const conversations = await Conversation.findAll({
    where: {
      [Op.or]: [{ user1Id: userIdNum }, { user2Id: userIdNum }]
    },
    include: [
      {
        model: User,
        as: 'user1',
        include: [{ model: UserProfile, as: 'profile' }]
      },
      {
        model: User,
        as: 'user2',
        include: [{ model: UserProfile, as: 'profile' }]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  // Transform the data to match the desired response format
  const transformedConversations = await Promise.all(
    conversations.map(async (conv) => {
      try {
        const conversation = conv.toJSON();
        const otherUser = conversation.user1Id == userIdNum ? conversation.user2 : conversation.user1;
        // Check if otherUser exists
        if (!otherUser) {
          console.error('Missing otherUser for conversation:', conversation);
          return null;
        }

        // Skip if otherUser is the same as logged-in user (invalid conversation)
        if (otherUser.id === userIdNum) {
          console.error('Invalid conversation: otherUser is same as logged-in user', conversation);
          return null;
        }

        // Get the last message for this conversation
        const lastMessage = await Message.findOne({
          where: { conversationId: conversation.id },
        order: [['sentAt', 'DESC']]
        });

        // Count unread messages in this conversation
        const unreadCount = await Message.count({
          where: {
            conversationId: conversation.id,
            senderId: { [Op.ne]: userIdNum },
            isRead: false
          }
        });

        return {
          id: `${conversation.id}`,
          participant: {
            id: `${otherUser.id}`,
            name: `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim() || 'Unknown',
            email: otherUser.email,
            mobile: otherUser.mobile,
            gender: otherUser.gender,
            profileImage: otherUser.profile?.profileImage || null,
            isOnline: otherUser.profile?.isOnline || false
          },
          lastMessage: lastMessage ? {
            id: `${lastMessage.id}`,
            text: lastMessage.message,
            timestamp: lastMessage.sentAt,
            isRead: lastMessage.isRead
          } : null,
          unreadCount,
          updatedAt: lastMessage ? lastMessage.sentAt : conversation.createdAt
        };
      } catch (error) {
        console.error('Error processing conversation:', error);
        return null;
      }
    })
  );

  // Filter out null results
  const validConversations = transformedConversations.filter(conv => conv !== null);

  return validConversations;
};

/* SINGLE CONVERSATION */
export const getConversation = (userId, id) => {
  const userIdNum = parseInt(userId, 10);
  return Conversation.findOne({
    where: {
      id,
      [Op.or]: [{ user1Id: userIdNum }, { user2Id: userIdNum }]
    }
  });
};

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
export const getMessages = async (userId, conversationId, limit = 50, before = null) => {
  const userIdNum = parseInt(userId, 10);
  const conversationIdNum = parseInt(conversationId, 10);

  // Check if user is part of the conversation
  const conversation = await Conversation.findOne({
    where: {
      id: conversationIdNum,
      [Op.or]: [{ user1Id: userIdNum }, { user2Id: userIdNum }]
    }
  });

  if (!conversation) {
    throw new Error('Conversation not found or access denied');
  }

  const whereClause = { conversationId: conversationIdNum };
  if (before) {
    whereClause.sentAt = { [Op.lt]: new Date(before) };
  }

  const messages = await Message.findAll({
    where: whereClause,
    order: [['sentAt', 'DESC']],
    limit: limit + 1 // Fetch one extra to check if there are more
  });

  const hasMore = messages.length > limit;
  const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

  // Reverse to get ascending order
  messagesToReturn.reverse();

  return {
    messages: messagesToReturn,
    hasMore
  };
};

/* DELETE MESSAGE */
export const deleteMessage = async (userId, id) => {
  const userIdNum = parseInt(userId, 10);
  await Message.destroy({ where: { id, senderId: userIdNum } });
};

/* MARK READ */
export const markRead = async (userId, conversationId) => {
  const userIdNum = parseInt(userId, 10);
  await Message.update(
    { isRead: true },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userIdNum }
      }
    }
  );
};

/* UNREAD COUNT */
export const unreadCount = async (userId) => {
  const userIdNum = parseInt(userId, 10);
  return Message.count({
    where: {
      isRead: false,
      senderId: { [Op.ne]: userIdNum }
    }
  });
};
