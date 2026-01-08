// presence.service.js
class PresenceService {
  constructor() {
    this.onlineUsers = new Set();
    this.typingUsers = {};
  }

  userOnline(userId) {
    this.onlineUsers.add(userId);
  }

  userOffline(userId) {
    this.onlineUsers.delete(userId);
  }

  typingStart(userId, conversationId) {
    this.typingUsers[conversationId] = userId;
  }

  typingStop(userId, conversationId) {
    delete this.typingUsers[conversationId];
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers);
  }
}

export default new PresenceService();
