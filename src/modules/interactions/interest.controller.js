import * as service from './interest.service.js';

export const send = async (req, res) => {
  try {
    const result = await service.sendInterest(req.user.id, req.body.receiverId);
    res.json({
      success: true,
      data: {
        interest: result.interest,
        usage: {
          usedToday: result.quota.usedToday + 1,
          dailyLimit: result.quota.dailyLimit,
          remainingToday: result.quota.remainingToday === null ? null : Math.max(0, result.quota.remainingToday - 1),
          activePlan: result.quota.activePlan,
        },
      },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.meta ? { data: error.meta } : {}),
    });
  }
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
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  res.json(await service.getSentInterests(req.user.id, limit, offset));
};

export const received = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const result = await service.getReceivedInterests(req.user.id, limit, offset);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch received requests',
      ...(error?.message ? { error: error.message } : {})
    });
  }
};

export const mutual = async (req, res) => {
  res.json(await service.getMutualInterests(req.user.id));
};
