import { setUserFCMToken } from '../../services/pushNotification.service.js';

export const registerFCMToken = async (req, res) => {
  const { fcmToken } = req.body || {};

  if (!fcmToken || typeof fcmToken !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'fcmToken is required',
    });
  }

  await setUserFCMToken(req.user.id, fcmToken);

  return res.json({
    success: true,
    data: {
      registered: true,
    },
  });
};
