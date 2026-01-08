import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserActivity from '../../models/userActivity.model.js';

/* ADMIN / PUBLIC */
export const getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: { exclude: ['passwordHash'] },
    include: [{ model: UserProfile, as: 'profile' }]
  });
};

export const updateUserById = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  await user.update(data);
  return user;
};

export const deleteUserById = async (id) => {
  await User.destroy({ where: { id } });
};

/* ME */
export const getMyProfile = async (userId) => {
  return await UserProfile.findOne({ where: { userId } });
};

export const updateMyProfile = async (userId, data) => {
  const [profile] = await UserProfile.upsert(
    { userId, ...data },
    { returning: true }
  );
  return profile;
};

export const getMySettings = async (userId) => {
  const user = await User.findByPk(userId);
  return user.settings || {};
};

export const updateMySettings = async (userId, settings) => {
  const user = await User.findByPk(userId);
  user.settings = settings;
  await user.save();
  return user.settings;
};

export const getMyActivity = async (userId) => {
  return await UserActivity.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 20
  });
};

export const deactivateAccount = async (userId) => {
  await User.update({ isActive: false }, { where: { id: userId } });
};

export const reactivateAccount = async (userId) => {
  await User.update({ isActive: true }, { where: { id: userId } });
};
