import * as service from './profileView.service.js';

export const view = async (req, res) => {
  await service.addProfileView(req.user.id, req.body.viewedId);
  res.json({ success: true });
};

export const list = async (req, res) => {
  res.json(await service.getProfileViews(req.user.id));
};
