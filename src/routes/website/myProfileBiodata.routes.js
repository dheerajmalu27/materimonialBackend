import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authGuard } from '../../middlewares/auth.middleware.js';

import * as biodataController from '../../modules/user/websiteBiodata.controller.js';

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
    const ext = path.extname(file.originalname || file.filename || '').toLowerCase() || '.pdf';
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimetypeOk = /^application\/pdf$/i.test(file.mimetype);
    const extOk = ext === '.pdf';
    if (mimetypeOk || extOk) cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/users/me/biodata', authGuard, upload.single('biodata'), biodataController.uploadMyProfileBiodata);

router.get('/users/me/biodata/download', authGuard, biodataController.downloadMyProfileBiodata);

export default router;

