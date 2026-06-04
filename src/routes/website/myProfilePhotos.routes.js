import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as websiteProfilePhotosController from '../../modules/user/websiteProfilePhotos.controller.js';

const router = express.Router();

// Multer storage (website-specific route)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || 'public';
    const uploadPath = path.join(process.cwd(), 'uploads', String(userId));
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/i;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

router.post('/users/me/photos', authGuard, upload.array('photos', 6), websiteProfilePhotosController.uploadPhotos);
router.delete('/users/me/photos', authGuard, websiteProfilePhotosController.deletePhoto);

export default router;

