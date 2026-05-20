import * as service from './websiteShortlist.service.js';

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const list = async (req, res) => {
  const limit = toInt(req.query.limit, 9);
  const offset = toInt(req.query.offset, 0);
  const filter = req.query.filter || 'all';
  const sort = req.query.sort || 'latestSaved';
  const query = req.query.query || '';

  const data = await service.getWebsiteShortlists(req.user.id, { limit, offset, filter, sort, query });
  return res.json({ items: data.items, total: data.total, limit: data.limit, offset: data.offset });
};

export const remove = async (req, res) => {
  const { shortlistedUserId } = req.params;
  await service.removeWebsiteShortlist(req.user.id, shortlistedUserId);
  return res.json({ success: true });
};

