import * as service from './websiteSettings.service.js';

export const getMyWebsiteSettings = async (req, res) => {
  try {
    const settings = await service.getWebsiteUserSettings(req.user.id);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch settings' });
  }
};

export const updateMyWebsiteSettings = async (req, res) => {
  try {
    await service.updateWebsiteUserSettings(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update settings' });
  }
};


