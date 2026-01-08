import cluster from 'cluster';
import os from 'os';
import http from 'http';
import app from './app.js';
import { initSocket } from './socket/index.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🧠 Master ${process.pid} running`);
  console.log(`⚙️ Forking ${numCPUs} workers...\n`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`❌ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

} else {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log(`✅ DB connected (Worker ${process.pid})`);

      // ✅ CREATE HTTP SERVER
      const server = http.createServer(app);

      // ✅ ATTACH SOCKET.IO TO HTTP SERVER
      const io = initSocket(server);

      // OPTIONAL: make io available in controllers
      app.use((req, res, next) => {
        req.io = io;
        next();
      });

      server.listen(env.port, () => {
        console.log(
          `🚀 Worker ${process.pid} listening on port ${env.port}`
        );
      });

    } catch (error) {
      console.error('❌ DB connection failed:', error);
      process.exit(1);
    }
  })();
}
