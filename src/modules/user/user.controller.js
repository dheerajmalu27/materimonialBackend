import * as service from './user.service.js';

/* ADMIN / PUBLIC */
export const getUserById = async (req, res) => {
  const user = await service.getUserById(req.params.id);
  res.json(user);
};

export const updateUserById = async (req, res) => {
  const user = await service.updateUserById(req.params.id, req.body);
  res.json(user);
};

export const deleteUserById = async (req, res) => {
  await service.deleteUserById(req.params.id);
  res.json({ message: 'User deleted' });
};

/* ME */
export const getMyProfile = async (req, res) => {
  const profile = await service.getMyProfile(req.user.id);
  res.json(profile);
};

export const updateMyProfile = async (req, res) => {
  const profile = await service.updateMyProfile(req.user.id, req.body);
  res.json(profile);
};

export const getMySettings = async (req, res) => {
  const settings = await service.getMySettings(req.user.id);
  res.json(settings);
};

export const updateMySettings = async (req, res) => {
  const settings = await service.updateMySettings(req.user.id, req.body);
  res.json(settings);
};

export const getMyActivity = async (req, res) => {
  const activity = await service.getMyActivity(req.user.id);
  res.json(activity);
};

export const deactivateAccount = async (req, res) => {
  await service.deactivateAccount(req.user.id);
  res.json({ message: 'Account deactivated' });
};

export const reactivateAccount = async (req, res) => {
  await service.reactivateAccount(req.user.id);
  res.json({ message: 'Account reactivated' });
};
