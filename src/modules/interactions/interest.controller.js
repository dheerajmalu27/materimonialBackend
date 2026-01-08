import * as service from './interest.service.js';

export const send = async (req, res) => {
  await service.sendInterest(req.user.id, req.body.receiverId);
  res.json({ success: true });
};

export const accept = async (req, res) => {
  await service.updateInterestStatus(req.body.senderId, req.user.id, 'accepted');
  res.json({ success: true });
};

export const reject = async (req, res) => {
  await service.updateInterestStatus(req.body.senderId, req.user.id, 'rejected');
  res.json({ success: true });
};

export const cancel = async (req, res) => {
  await service.updateInterestStatus(req.user.id, req.body.receiverId, 'cancelled');
  res.json({ success: true });
};

export const sent = async (req, res) => {
  res.json(await service.getSentInterests(req.user.id));
};

export const received = async (req, res) => {
  res.json(await service.getReceivedInterests(req.user.id));
};

export const mutual = async (req, res) => {
  res.json(await service.getMutualInterests(req.user.id));
};
