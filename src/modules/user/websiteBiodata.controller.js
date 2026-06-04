import fs from 'fs';
import path from 'path';
import UserProfile from '../../models/userProfile.model.js';
import { env } from '../../config/env.js';
const isPdf = (filename) => {
  if (!filename) return false;
  return String(path.extname(filename)).toLowerCase() === '.pdf';
};

export const uploadMyProfileBiodata = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'biodata pdf is required' });
    }

    const userId = req.user.id;
    const file = req.file;

    if (!isPdf(file.originalname || file.filename)) {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed' });
    }

    // URL: relies on your express static serving of /uploads
    const host = req.get('host');
    const protocol = req.protocol;
    const biodataUrl = `${protocol}://${host}/${env.fileuploadPrefix}/${userId}/${file.filename}`;

    await UserProfile.upsert(
      {
        userId,
        biodataPdf: biodataUrl,
      },
      { returning: false }
    );

    return res.json({ success: true, data: { biodataPdf: biodataUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload biodata' });
  }
};

export const downloadMyProfileBiodata = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await UserProfile.findOne({ where: { userId } });
    const biodataPdf = profile?.biodataPdf;

    if (!biodataPdf) {
      return res.status(404).json({ success: false, message: 'Biodata PDF not uploaded' });
    }

    const filename = path.basename(String(biodataPdf));
    const filePath = path.join(process.cwd(), 'uploads', String(userId), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Biodata PDF file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="biodata_${userId}.pdf"`);

    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.status(500).end();
    });
    return stream.pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to download biodata' });
  }
};

