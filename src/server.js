import http from 'http';
import app from './app.js';
import { initSocket } from './socket/index.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';

(async () => {
  try {
    // ✅ Database Connection
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // ✅ Create HTTP Server
    const server = http.createServer(app);

    // ✅ Initialize Socket.IO
    const io = initSocket(server);

    // ✅ Make io accessible in routes/controllers
    app.use((req, res, next) => {
      req.io = io;
      next();
    });

    // ✅ Start Server
    server.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${env.port}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
})();