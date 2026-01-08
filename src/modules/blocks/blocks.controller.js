// blocks.controller.js
import * as service from './blocks.service.js';

export const blockUser = async (req, res) => {
  const data = await service.blockUser(req.user.id, req.body.blockedUserId);
  res.status(201).json({
    success: true,
    message: 'User blocked successfully',
    data
  });
};

export const unblockUser = async (req, res) => {
  await service.unblockUser(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'User unblocked successfully'
  });
};

export const getBlockedUsers = async (req, res) => {
  const data = await service.getBlockedUsers(req.user.id);
  res.json({
    success: true,
    data
  });
};
