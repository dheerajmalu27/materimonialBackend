import db from '../models/index.js';

const { UserPushToken } = db;

export const setUserPushToken = async (userId, token) => {
  if (!userId || !token) return;

  await UserPushToken.upsert({
    userId: Number(userId),
    expoPushToken: String(token),
    updatedAt: new Date(),
  });
};

export const removeUserPushToken = async (userId) => {
  if (!userId) return;
  await UserPushToken.destroy({
    where: { userId: Number(userId) },
  });
};

export const getUserPushToken = async (userId) => {
  if (!userId) return null;

  const tokenRow = await UserPushToken.findOne({
    where: { userId: Number(userId) },
  });

  return tokenRow?.expoPushToken || null;
};

export const sendIncomingCallPush = async ({ targetUserId, callerName, conversationId, callerId }) => {
  const expoPushToken = await getUserPushToken(targetUserId);
  if (!expoPushToken) return { sent: false, reason: 'NO_PUSH_TOKEN' };

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Incoming Video Call',
    body: `${callerName || 'Someone'} is calling you`,
    priority: 'high',
    channelId: 'default',
    categoryId: 'incoming_call',
    data: {
      type: 'incoming_video_call',
      conversationId: String(conversationId),
      callerId: String(callerId),
      callerName: callerName || 'Someone',
    },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      return { sent: false, reason: 'PUSH_SEND_FAILED' };
    }

    const responseBody = await response.json().catch(() => null);
    const firstResult = Array.isArray(responseBody?.data) ? responseBody.data[0] : null;
    if (firstResult?.status === 'error' && firstResult?.details?.error === 'DeviceNotRegistered') {
      await removeUserPushToken(targetUserId);
      return { sent: false, reason: 'TOKEN_NOT_REGISTERED' };
    }

    return { sent: true };
  } catch (error) {
    console.error('Push send error:', error);
    return { sent: false, reason: 'PUSH_SEND_EXCEPTION' };
  }
};
