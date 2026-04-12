import UserActivity from '../models/userActivity.model.js';

const normalizeAction = (action = 'UNKNOWN_ACTION') => {
  return String(action)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'UNKNOWN_ACTION';
};

const getRequestIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req?.ip || null;
};

const stringifyDescription = (description) => {
  if (description === undefined || description === null) return null;
  if (typeof description === 'string') return description;

  try {
    return JSON.stringify(description);
  } catch (error) {
    return String(description);
  }
};

const normalizePathForAction = (path = '') => {
  return String(path)
    .split('?')[0]
    .replace(/^\/api\/v\d+\//i, '')
    .replace(/\/[0-9]+(?=\/|$)/g, '/id')
    .replace(/\/[a-f0-9]{24}(?=\/|$)/gi, '/id')
    .replace(/\/{2,}/g, '/')
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/[^a-zA-Z0-9/]+/g, '_')
    .replace(/\//g, '_');
};

export const buildApiAction = (req) => {
  const method = String(req?.method || 'UNKNOWN').toUpperCase();
  const normalizedPath = normalizePathForAction(req?.originalUrl || req?.path || 'unknown');
  return normalizeAction(`API_${method}_${normalizedPath || 'UNKNOWN'}`);
};

export const logActivity = async ({
  userId,
  action,
  description,
  req,
  ipAddress,
  userAgent,
  markRequestAsLogged = false,
}) => {
  try {
    if (!userId) return;

    await UserActivity.create({
      userId,
      action: normalizeAction(action),
      description: stringifyDescription(description),
      ipAddress: ipAddress || getRequestIp(req),
      userAgent: userAgent || req?.headers?.['user-agent'] || null,
    });

    if (markRequestAsLogged && req) {
      req.__activityLogged = true;
    }
  } catch (err) {
    console.error('ACTIVITY LOG ERROR 👉', err.message);
  }
};
