import Interest from '../../models/interest.model.js';
import { Op } from 'sequelize';

export const sendInterest = async (senderId, receiverId) => {
  return Interest.create({
    senderId,
    receiverId,
    status: 'sent'
  });
};

export const updateInterestStatus = async (senderId, receiverId, status) => {
  const interest = await Interest.findOne({
    where: { senderId, receiverId }
  });

  if (!interest) throw new Error('Interest not found');

  interest.status = status;
  await interest.save();
};

export const getSentInterests = (userId) =>
  Interest.findAll({ where: { senderId: userId } });

export const getReceivedInterests = (userId) =>
  Interest.findAll({ where: { receiverId: userId } });

export const getMutualInterests = (userId) =>
  Interest.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [{ senderId: userId }, { receiverId: userId }]
    }
  });
