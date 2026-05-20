import { Router } from 'express';
import websiteRoutes from './website.routes.js';

const router = Router();

router.use('/', websiteRoutes);

export default router;

