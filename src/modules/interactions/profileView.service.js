import ProfileView from '../../models/profileView.model.js';

export const addProfileView = async (viewerId, viewedUserId) => {
  return ProfileView.create({
    viewerId,
    viewedUserId,
    viewedAt: new Date()
  });
};

export const getProfileViews = async (userId) => {
  return ProfileView.findAll({
    where: { viewedUserId: userId }
  });
};
