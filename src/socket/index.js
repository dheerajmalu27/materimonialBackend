import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import {env} from '../config/env.js';
import { sendIncomingCallPush } from '../services/pushNotification.service.js';
import { getUserEntitlements } from '../modules/monetization/monetization.service.js';

const onlineUsers = new Map();
const activeCallByUser = new Map();
const pendingCalls = new Map();
const callSessions = new Map();

const getSessionId = ({ callerId, targetUserId, conversationId }) =>
  `${callerId}:${targetUserId}:${conversationId}:${Date.now()}`;

const releaseSessionUsers = (session) => {
  if (!session) return;
  if (activeCallByUser.get(String(session.callerId)) === session.id) {
    activeCallByUser.delete(String(session.callerId));
  }
  if (activeCallByUser.get(String(session.targetUserId)) === session.id) {
    activeCallByUser.delete(String(session.targetUserId));
  }
};

const clearPendingSession = (sessionId) => {
  const session = pendingCalls.get(sessionId);
  if (!session) return null;
  if (session.timer) {
    clearTimeout(session.timer);
  }
  pendingCalls.delete(sessionId);
  return session;
};

const removeSession = (sessionId) => {
  clearPendingSession(sessionId);
  callSessions.delete(String(sessionId));
};

const findPendingSession = ({ sessionId, callerId, calleeId, conversationId }) => {
  if (sessionId && callSessions.has(String(sessionId))) {
    return callSessions.get(String(sessionId));
  }

  for (const session of callSessions.values()) {
    if (
      String(session.callerId) === String(callerId) &&
      String(session.targetUserId) === String(calleeId) &&
      String(session.conversationId) === String(conversationId)
    ) {
      return session;
    }
  }

  return null;
};

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, env.jwt.jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user.id);
    onlineUsers.set(userId, socket.id);

    console.log(`🟢 User ${userId} connected`);

    io.emit('online-users', [...onlineUsers.keys()]);

    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('send-message', (data) => {
      io.to(`conversation_${data.conversationId}`)
        .emit('receive-message', data);
    });

    socket.on('typing-start', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`)
        .emit('typing-start', { userId });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`)
        .emit('typing-stop', { userId });
    });

    socket.on('video-call-invite', async ({ targetUserId, conversationId, callerName }) => {
      const targetId = String(targetUserId);
      const targetSocketId = onlineUsers.get(targetId);

      if (activeCallByUser.has(userId)) {
        socket.emit('video-call-busy', {
          conversationId,
          reason: 'CALLER_BUSY',
        });
        return;
      }

      if (activeCallByUser.has(targetId)) {
        socket.emit('video-call-busy', {
          targetUserId: targetId,
          conversationId,
          reason: 'TARGET_BUSY',
        });
        return;
      }

      const callerEntitlements = await getUserEntitlements(userId);
      if (callerEntitlements.activePlan !== 'premium') {
        socket.emit('video-call-upgrade-required', {
          reason: 'CALLER_NOT_PREMIUM',
          conversationId,
        });
        return;
      }

      const targetEntitlements = await getUserEntitlements(targetId);
      if (targetEntitlements.activePlan !== 'premium') {
        socket.emit('video-call-unavailable', {
          targetUserId: targetId,
          conversationId,
          reason: 'TARGET_NOT_PREMIUM',
        });
        return;
      }

      await sendIncomingCallPush({
        targetUserId: targetId,
        callerName,
        conversationId,
        callerId: userId,
      });

      if (!targetSocketId) {
        socket.emit('video-call-unavailable', {
          targetUserId: targetId,
          conversationId,
        });
        return;
      }

      const sessionId = getSessionId({
        callerId: userId,
        targetUserId: targetId,
        conversationId,
      });

      const timeoutMs = 30000;
      const session = {
        id: sessionId,
        callerId: userId,
        targetUserId: targetId,
        conversationId: String(conversationId),
        status: 'ringing',
        timer: null,
      };

      session.timer = setTimeout(() => {
        const timedOutSession = clearPendingSession(sessionId);
        if (!timedOutSession) return;

        releaseSessionUsers(timedOutSession);
        callSessions.delete(String(timedOutSession.id));

        const callerSocketId = onlineUsers.get(String(timedOutSession.callerId));
        if (callerSocketId) {
          io.to(callerSocketId).emit('video-call-timeout', {
            conversationId: timedOutSession.conversationId,
            targetUserId: timedOutSession.targetUserId,
            sessionId: timedOutSession.id,
          });
        }

        const calleeSocketId = onlineUsers.get(String(timedOutSession.targetUserId));
        if (calleeSocketId) {
          io.to(calleeSocketId).emit('video-call-cancel', {
            callerId: timedOutSession.callerId,
            conversationId: timedOutSession.conversationId,
            reason: 'TIMEOUT',
            sessionId: timedOutSession.id,
          });
        }
      }, timeoutMs);

      pendingCalls.set(sessionId, session);
      callSessions.set(sessionId, session);
      activeCallByUser.set(userId, sessionId);
      activeCallByUser.set(targetId, sessionId);

      io.to(targetSocketId).emit('video-call-invite', {
        callerId: userId,
        callerName: callerName || 'Someone',
        conversationId,
        sessionId,
      });
    });

    socket.on('video-call-response', ({ callerId, conversationId, status, sessionId }) => {
      const callerSocketId = onlineUsers.get(String(callerId));
      if (!callerSocketId) return;

      const session = findPendingSession({
        sessionId,
        callerId,
        calleeId: userId,
        conversationId,
      });

      if (!session) return;

      if (status === 'accepted') {
        clearPendingSession(session.id);
        session.status = 'connected';
        activeCallByUser.set(String(session.callerId), session.id);
        activeCallByUser.set(String(session.targetUserId), session.id);
      } else {
        clearPendingSession(session.id);
        releaseSessionUsers(session);
        removeSession(session.id);
      }

      io.to(callerSocketId).emit('video-call-response', {
        fromUserId: userId,
        conversationId,
        status,
        sessionId: session.id,
      });
    });

    socket.on('video-call-cancel', ({ targetUserId, conversationId, sessionId }) => {
      const resolvedSessionId = sessionId || activeCallByUser.get(userId);
      if (resolvedSessionId) {
        const session = callSessions.get(String(resolvedSessionId)) || {
          id: String(resolvedSessionId),
          callerId: userId,
          targetUserId: String(targetUserId || ''),
        };
        removeSession(String(resolvedSessionId));
        releaseSessionUsers(session);
      }

      const targetSocketId = onlineUsers.get(String(targetUserId));
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('video-call-cancel', {
        callerId: userId,
        conversationId,
        sessionId: resolvedSessionId,
      });
    });

    socket.on('disconnect', () => {
      const activeSessionId = activeCallByUser.get(userId);
      if (activeSessionId) {
        const session = callSessions.get(String(activeSessionId));
        removeSession(String(activeSessionId));
        const targetUserId =
          String(session?.callerId) === userId
            ? String(session?.targetUserId || '')
            : String(session?.callerId || '');

        if (targetUserId) {
          const targetSocketId = onlineUsers.get(targetUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('video-call-cancel', {
              callerId: userId,
              conversationId: session?.conversationId,
              reason: 'DISCONNECTED',
              sessionId: String(activeSessionId),
            });
          }
        }

        releaseSessionUsers(session || { id: String(activeSessionId), callerId: userId, targetUserId: targetUserId || '' });
      }

      onlineUsers.delete(userId);
      io.emit('online-users', [...onlineUsers.keys()]);
      console.log(`🔴 User ${userId} disconnected`);
    });
  });

  return io;
};

export { onlineUsers };
