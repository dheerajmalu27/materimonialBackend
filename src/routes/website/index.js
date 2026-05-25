import { Router } from 'express';
import websiteRoutes from './website.routes.js';
import myProfileSectionRoutes from './myProfileSection.routes.js';
import monetizationRoutes from './monetization.routes.js';
import myProfilePhotosRoutes from './myProfilePhotos.routes.js';
import myProfileBiodataRoutes from './myProfileBiodata.routes.js';

const router = Router();

router.use('/', websiteRoutes);
router.use('/', myProfileSectionRoutes);
router.use('/', monetizationRoutes);
router.use('/', myProfilePhotosRoutes);
router.use('/', myProfileBiodataRoutes);

export default router;




