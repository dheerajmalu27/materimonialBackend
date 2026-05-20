import * as service from './websiteRequests.service.js';

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const sent = async (req, res) => {
  const limit = toInt(req.query.limit, 9);
  const offset = toInt(req.query.offset, 0);
  const status = req.query.status || 'all';
  const sort = req.query.sort || 'latest';
  const query = req.query.query || '';

  const data = await service.getWebsiteSentRequests(req.user.id, { limit, offset, status, sort, query });
  return res.json(data ? { items: data.items, total: data.total, limit: data.limit, offset: data.offset } : { items: [], total: 0, limit, offset });
};

export const received = async (req, res) => {
  const limit = toInt(req.query.limit, 9);
  const offset = toInt(req.query.offset, 0);
  const status = req.query.status || 'all';
  const sort = req.query.sort || 'latest';
  const query = req.query.query || '';

  const data = await service.getWebsiteReceivedRequests(req.user.id, { limit, offset, status, sort, query });
  return res.json(data ? { items: data.items, total: data.total, limit: data.limit, offset: data.offset } : { items: [], total: 0, limit, offset });
};

