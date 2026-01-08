import UserActivity from '../models/userActivity.model.js';

export const logActivity = async ({
  userId,
  action,
  description,
  req
}) => {
  try {
    await UserActivity.create({
      userId,
      action,
      description,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent']
    });
  } catch (err) {
    console.error('ACTIVITY LOG ERROR 👉', err.message);
  }
};
