import User from '../../models/user.model.js';
import UserSettings from '../../models/userSettings.model.js';
import { defaultWebsiteSettingsByPlan, deepMerge } from './defaultWebsiteSettings.js';

const normalizeSettings = (s) => {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return {};
  return s;
};

const getDefaultsForUser = async (userId) => {
  // Plan-aware defaults would need subscription lookup. Until then, use free defaults.
  // This keeps the API contract stable and prevents UI crashes on missing fields.
  return defaultWebsiteSettingsByPlan?.free || {};
};

export const getWebsiteUserSettings = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return {};

  const row = await UserSettings.findOne({ where: { userId } });
  const stored = normalizeSettings(row?.settings);

  if (Object.keys(stored).length > 0) return stored;

  const defaults = await getDefaultsForUser(userId);
  return normalizeSettings(deepMerge(defaults, {}));
};

export const updateWebsiteUserSettings = async (userId, settings) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const incoming = normalizeSettings(settings);
  const defaults = await getDefaultsForUser(userId);
  const merged = normalizeSettings(deepMerge(defaults, incoming));

  const [row, created] = await UserSettings.findOrCreate({
    where: { userId },
    defaults: { settings: merged },
  });

  if (!created) {
    row.settings = merged;
    await row.save();
  }

  return normalizeSettings(row.settings);
};


