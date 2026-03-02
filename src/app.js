import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import routes from './routes/index.js';
import { env } from './config/env.js';
import { swaggerUi, specs } from './swagger.js';

const app = express();

// Middlewares
app.use(cors());
// Configure helmet but allow cross-origin resource loading (so /uploads can be fetched from LAN devices)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// serve uploaded files
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Matrimonial API running 🚀' });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// BASE API PREFIX
app.use(env.apiPrefix, routes);

export default app;
