import fs from 'fs';
import path from 'path';
import UserProfile from '../../models/userProfile.model.js';
import { env } from '../../config/env.js';
const removeUserFileIfExists = (fileUrl, userId) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;

  try {
    const filename = path.basename(fileUrl);
    const filePath = path.join(process.cwd(), 'uploads', String(userId), filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore cleanup failures
  }
};

const normalizeProfileImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // ignore
    }
  }
  return [];
};

export const uploadPhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const userId = req.user.id;

    // Public URL builder (relies on your express static serving of /uploads)
    const host = req.get('host');
    const protocol = req.protocol;

    const newUrls = req.files.map((file) => `${protocol}://${host}/${env.fileuploadPrefix}/${userId}/${file.filename}`);

    const profile = await UserProfile.findOne({ where: { userId } });

    const existing = normalizeProfileImages(profile?.profileImages);
    const merged = [...existing, ...newUrls].filter(Boolean);

    await UserProfile.upsert(
      {
        userId,
        profileImages: merged,
        profileImage: merged[0] || null,
      },
      { returning: false }
    );

    return res.json({ success: true, data: { urls: merged, profileImage: merged[0] || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload photos' });
  }
};

export const deletePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'url is required' });
    }

    const profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const images = normalizeProfileImages(profile.profileImages);
    if (!images.includes(url)) {
      // tolerate mismatch: delete by filename as fallback
      const filename = path.basename(url);
      const matchIdx = images.findIndex((x) => path.basename(x) === filename);
      if (matchIdx === -1) {
        return res.status(404).json({ success: false, message: 'Photo not found' });
      }
    }

    const filtered = images.filter((img) => img !== url && path.basename(img) !== path.basename(url));

    // cleanup file
    removeUserFileIfExists(url, userId);

    await UserProfile.upsert(
      {
        userId,
        profileImages: filtered,
        profileImage: filtered[0] || null,
      },
      { returning: false }
    );

    return res.json({ success: true, data: { urls: filtered, profileImage: filtered[0] || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete photo' });
  }
};

