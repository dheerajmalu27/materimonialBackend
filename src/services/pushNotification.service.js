import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

import { Op } from 'sequelize';
import admin from 'firebase-admin';
import fs from 'fs';
const { User, UserProfile } = db;

// Initialize Firebase Admin SDK (singleton)
let firebaseInitialized = false;
function initFirebaseAdmin() {
  if (!firebaseInitialized) {
    const serviceAccountPath = path.resolve(__dirname, '../config/firebaseServiceAccount.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
  }
}
export const sendInterestReceivedPush = async ({ targetUserId, senderId, senderName }) => {
  initFirebaseAdmin();
  // Get FCM token for the receiver
  const fcmToken = await getUserFCMToken(targetUserId);
  console.log('DEBUG_FCM_INTEREST:', { targetUserId, fcmToken: fcmToken ? fcmToken.slice(0, 20) + '...' : null });
  if (!fcmToken) return { sent: false, reason: 'NO_FCM_TOKEN' };

  // Get sender's name if not provided
  let senderDisplayName = senderName;
  if (!senderDisplayName) {
    const senderProfile = await UserProfile.findOne({ where: { userId: senderId } });
    if (senderProfile) {
      senderDisplayName = [senderProfile.firstName, senderProfile.lastName].filter(Boolean).join(' ');
    } else {
      senderDisplayName = 'Someone';
    }
  }

  const message = {
    notification: {
      title: 'New Interest Received',
      body: `${senderDisplayName} is interested in your profile!`,
    },
    token: fcmToken,
    data: {
      type: 'interest_received',
      senderId: String(senderId),
      senderName: senderDisplayName,
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return { sent: true, response };
  } catch (error) {
    console.error('FCM push send error:', error);
    // Remove token if invalid
    if (error.code === 'messaging/registration-token-not-registered') {
      await removeUserFCMToken(targetUserId);
      return { sent: false, reason: 'TOKEN_NOT_REGISTERED' };
    }
    return { sent: false, reason: error.code || 'FCM_SEND_EXCEPTION' };
  }
};
import db from '../models/index.js';

const { UserPushToken } = db;

export const setUserFCMToken = async (userId, token) => {
  if (!userId || !token) return;

  await UserPushToken.upsert({
    userId: Number(userId),
    fcmToken: String(token),
    updatedAt: new Date(),
  });
};

export const removeUserFCMToken = async (userId) => {
  if (!userId) return;
  await UserPushToken.destroy({
    where: { userId: Number(userId) },
  });
};

export const getUserFCMToken = async (userId) => {
  if (!userId) return null;


  const tokenRow = await UserPushToken.findOne({
    where: { userId: Number(userId) },
  });

  const fcmToken = tokenRow?.fcmToken || null;
  console.log('DEBUG_FCM_GET:', { userId: Number(userId), tokenRow: tokenRow ? { id: tokenRow.id, fcmToken: tokenRow.fcmToken?.slice(0, 20) + '...' } : null, fcmToken });
  return fcmToken;

};

export const sendIncomingCallPushFCM = async ({ targetUserId, callerName, conversationId, callerId }) => {
  initFirebaseAdmin();
  const fcmToken = await getUserFCMToken(targetUserId);
  if (!fcmToken) return { sent: false, reason: 'NO_FCM_TOKEN' };

  const message = {
    notification: {
      title: 'Incoming Video Call',
      body: `${callerName || 'Someone'} is calling you`,
    },
    token: fcmToken,
    data: {
      type: 'incoming_video_call',
      conversationId: String(conversationId),
      callerId: String(callerId),
      callerName: callerName || 'Someone',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return { sent: true, response };
  } catch (error) {
    console.error('FCM call push error:', error);
    if (error.code === 'messaging/registration-token-not-registered') {
      await removeUserFCMToken(targetUserId);
      return { sent: false, reason: 'TOKEN_NOT_REGISTERED' };
    }
    return { sent: false, reason: error.code || 'FCM_SEND_EXCEPTION' };
  }
};
