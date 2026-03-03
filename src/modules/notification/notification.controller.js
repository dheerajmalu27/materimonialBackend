import { setUserPushToken } from '../../services/pushNotification.service.js';

export const registerPushToken = async (req, res) => {
  const { expoPushToken } = req.body || {};

  if (!expoPushToken || typeof expoPushToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'expoPushToken is required',
    });
  }

  await setUserPushToken(req.user.id, expoPushToken);

  return res.json({
    success: true,
    data: {
      registered: true,
    },
  });
};
