import Interest from '../../models/interest.model.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { enforceInterestQuota } from '../monetization/monetization.service.js';

export const sendInterest = async (senderId, receiverId) => {
  const quota = await enforceInterestQuota(senderId);

  const interest = await Interest.create({
    senderId,
    receiverId,
    status: 'sent'
  });

  return {
    interest,
    quota
  };
};

export const updateInterestStatus = async (senderId, receiverId, status) => {
  const interest = await Interest.findOne({
    where: { senderId, receiverId }
  });

  if (!interest) throw new Error('Interest not found');

  interest.status = status;
  await interest.save();
};

export const getSentInterests = async (userId, limit = 20, offset = 0) => {
  const interests = await sequelize.query(
    `SELECT id, status, created_at, receiver_id, receiver_first_name, receiver_last_name, receiver_age, receiver_height, receiver_education, receiver_is_active, receiver_city, receiver_state, receiver_photo
     FROM public.interests_with_user_details
     WHERE sender_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    {
      bind: [userId, limit, offset],
      type: sequelize.QueryTypes.SELECT
    }
  );

  // Get total count
  const totalCountResult = await sequelize.query(
    `SELECT COUNT(*) as count FROM public.interests_with_user_details WHERE sender_id = $1`,
    {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    }
  );
  const totalCount = parseInt(totalCountResult[0].count);

  // Format response according to specification
  const requests = interests.map(interest => ({
    id: `req_${interest.id}`,
    recipient: {
      id: `user_${interest.receiver_id}`,
      name: `${interest.receiver_first_name} ${interest.receiver_last_name}`,
      age: interest.receiver_age,
      location: `${interest.receiver_city || ''}, ${interest.receiver_state || ''}`.trim(),
      occupation: '', // TODO: Add occupation field
      profileImage: interest.receiver_photo || null
    },
    message: 'Hi, I found your profile interesting. Would like to connect.', // Default message
    timestamp: interest.created_at.toISOString(),
    status: interest.status
  }));

  return {
    success: true,
    data: {
      requests,
      totalCount,
      hasMore: offset + limit < totalCount
    }
  };
};

export const getReceivedInterests = async (userId) => {
  console.log(userId)
  const interests = await sequelize.query(
    `SELECT id, status, created_at, sender_id, sender_first_name, sender_last_name, sender_age, sender_height, sender_education, sender_is_active, sender_city, sender_state, sender_photo
     FROM public.interests_with_user_details
     WHERE receiver_id = $1`,
    {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    }
  );
console.log(interests);
  return {
    success: true,
    data: interests
  };
};

export const getMutualInterests = async (userId) => {
  // Get interests where user is sender and status is accepted (accepted by receiver)
  const acceptedByReceiver = await sequelize.query(
    `SELECT id, status, created_at, receiver_id, receiver_first_name, receiver_last_name, receiver_age, receiver_height, receiver_education, receiver_is_active, receiver_city, receiver_state, receiver_photo
     FROM public.interests_with_user_details
     WHERE sender_id = $1 AND status = 'accepted'`,
    {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    }
  );

  // Get interests where user is receiver and status is accepted (accepted by me)
  const acceptedByMe = await sequelize.query(
    `SELECT id, status, created_at, sender_id, sender_first_name, sender_last_name, sender_age, sender_height, sender_education, sender_is_active, sender_city, sender_state, sender_photo
     FROM public.interests_with_user_details
     WHERE receiver_id = $1 AND status = 'accepted'`,
    {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    }
  );

  // Combine results with appropriate labels
  const mutualInterests = [
    ...acceptedByReceiver.map(interest => ({
      ...interest,
      accepted_by: 'user' // accepted by the receiver (other user)
    })),
    ...acceptedByMe.map(interest => ({
      ...interest,
      accepted_by: 'me' // accepted by me (current user)
    }))
  ];

  return {
    success: true,
    data: mutualInterests
  };
};
