import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import {env} from '../config/env.js';

const onlineUsers = new Map();

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
    const userId = socket.user.id;
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

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('online-users', [...onlineUsers.keys()]);
      console.log(`🔴 User ${userId} disconnected`);
    });
  });

  return io;
};

export { onlineUsers };
