import models from '../../models/index.js';

/**
 * Block a user
 */
export const blockUser = async (userId, blockedUserId) => {
  // Check if user is trying to block themselves
  if (userId === blockedUserId) {
    const error = new Error('Cannot block yourself');
    error.status = 400;
    throw error;
  }

  // Check if user exists
  const blockedUser = await models.User.findByPk(blockedUserId);
  if (!blockedUser) {
    const error = new Error('User to block not found');
    error.status = 404;
    throw error;
  }

  // Check if already blocked
  const existingBlock = await models.BlockedUser.findOne({
    where: { user_id: userId, blocked_user_id: blockedUserId }
  });

  if (existingBlock) {
    const error = new Error('User is already blocked');
    error.status = 409;
    throw error;
  }

  // Create block record
  const block = await models.BlockedUser.create({
    user_id: userId,
    blocked_user_id: blockedUserId
  });

  return block;
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId, blockId) => {
  const block = await models.BlockedUser.findOne({
    where: { id: blockId, user_id: userId }
  });

  if (!block) {
    const error = new Error('Block record not found');
    error.status = 404;
    throw error;
  }

  await block.destroy();
};

/**
 * Get blocked users list
 */
export const getBlockedUsers = async (userId) => {
  const blockedUsers = await models.BlockedUser.findAll({
    where: { user_id: userId },
    include: [
      {
        model: models.User,
        as: 'blockedUser',
        attributes: ['id', 'email', 'mobile']
      }
    ],
    order: [['blocked_at', 'DESC']]
  });

  return blockedUsers;
};
