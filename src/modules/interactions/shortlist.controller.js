import * as service from './shortlist.service.js';

export const add = async (req, res) => {
  await service.addShortlist(req.user.id, req.body.userId);
  res.json({ success: true });
};

export const remove = async (req, res) => {
  await service.removeShortlist(req.params.id, req.user.id);
  res.json({ success: true });
};

export const list = async (req, res) => {
  res.json(await service.getShortlists(req.user.id));
};
