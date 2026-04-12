import Interest from '../../models/interest.model.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { enforceInterestQuota } from '../monetization/monetization.service.js';
import { sendInterestReceivedPush } from '../../services/pushNotification.service.js';

export const sendInterest = async (senderId, receiverId) => {
  console.log('sendInterest called with:', { senderId, receiverId });
  const quota = await enforceInterestQuota(senderId);
  console.log('Quota result:', quota);

  const interest = await Interest.create({
    senderId,
    receiverId,
    status: 'sent'
  });
  console.log('Interest created:', interest?.id);

  // Send push notification to receiver
  let pushResult;
  try {
    pushResult = await sendInterestReceivedPush({
      targetUserId: receiverId,
      senderId,
    });
    console.log('FCM push result:', pushResult);
  } catch (err) {
    console.error('FCM push error:', err);
  }

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
    `SELECT i.id, i.status, i.created_at, i.receiver_id, i.receiver_first_name, i.receiver_last_name,
            i.receiver_age, i.receiver_height, i.receiver_education, i.receiver_is_active,
            i.receiver_city, i.receiver_state, i.receiver_photo,
            up.location AS receiver_profile_location,
            up.occupation AS receiver_profile_occupation
     FROM public.interests_with_user_details i
     LEFT JOIN public.user_profiles up ON up.user_id = i.receiver_id
     WHERE i.sender_id = $1
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
  const requests = interests.map(interest => {
    const city = String(interest.receiver_city || '').trim();
    const state = String(interest.receiver_state || '').trim();
    const cityStateLocation = `${city}${city && state ? ', ' : ''}${state}`.trim();
    const profileLocation = String(interest.receiver_profile_location || '').trim();

    return {
      id: `${interest.id}`,
      recipient: {
        id: `${interest.receiver_id}`,
        name: `${interest.receiver_first_name} ${interest.receiver_last_name}`,
        age: interest.receiver_age,
        location: profileLocation || cityStateLocation,
        occupation: String(interest.receiver_profile_occupation || '').trim(),
        height: interest.receiver_height || null,
        profileImage: interest.receiver_photo || null
      },
      message: 'Hi, I found your profile interesting. Would like to connect.',
      timestamp: interest.created_at.toISOString(),
      status: interest.status
    };
  });

  return {
    success: true,
    data: {
      requests,
      totalCount,
      hasMore: offset + limit < totalCount
    }
  };
};

export const getReceivedInterests = async (userId, limit = 20, offset = 0) => {
  const parsedLimit = Number.isFinite(limit) ? Math.max(1, limit) : 20;
  const parsedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

  const interests = await sequelize.query(
    `SELECT id, status, created_at, sender_id, sender_first_name, sender_last_name, sender_age,
         sender_height, sender_education, sender_city, sender_state, sender_photo,
         up.location AS sender_profile_location,
         up.religion AS sender_religion,
         up.caste AS sender_caste,
         up.height_cm AS sender_profile_height,
         up.education AS sender_profile_education,
         up.occupation AS sender_occupation,
         up.about_me AS sender_bio,
         up.profile_image AS sender_profile_image,
         up.profile_images AS sender_profile_images
       FROM public.interests_with_user_details i
       LEFT JOIN public.user_profiles up ON up.user_id = i.sender_id
       WHERE receiver_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    {
      bind: [userId, parsedLimit, parsedOffset],
      type: sequelize.QueryTypes.SELECT
    }
  );

  const totalCountResult = await sequelize.query(
    `SELECT COUNT(*) as count
     FROM public.interests_with_user_details
     WHERE receiver_id = $1`,
    {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    }
  );

  const totalCount = parseInt(totalCountResult[0].count, 10) || 0;

  const matches = interests.map((interest) => {
    let profileImages = [];
    if (typeof interest.sender_profile_images === 'string' && interest.sender_profile_images.trim()) {
      try {
        const parsedImages = JSON.parse(interest.sender_profile_images);
        if (Array.isArray(parsedImages)) {
          profileImages = parsedImages.filter(Boolean).map((image) => String(image));
        }
      } catch (error) {
        profileImages = [];
      }
    }

    const city = String(interest.sender_city || '').trim();
    const state = String(interest.sender_state || '').trim();
    const cityStateLocation = `${city}${city && state ? ', ' : ''}${state}`.trim();
    const profileLocation = String(interest.sender_profile_location || '').trim();
    const location = profileLocation || cityStateLocation;
    const firstName = String(interest.sender_first_name || '').trim();
    const lastName = String(interest.sender_last_name || '').trim();
    const displayName = `${firstName}${firstName && lastName ? ' ' : ''}${lastName}`.trim() || 'Unknown';
    const profileImage = String(
      interest.sender_profile_image
      || (profileImages.length > 0 ? profileImages[0] : '')
      || interest.sender_photo
      || ''
    );

    return {
      id: String(interest.sender_id),
      name: displayName,
      age: Number(interest.sender_age || 0),
      location: location || null,
      occupation: String(interest.sender_occupation || '').trim(),
      bio: String(interest.sender_bio || '').trim(),
      religion: String(interest.sender_religion || '').trim(),
      caste: String(interest.sender_caste || '').trim(),
      height: interest.sender_profile_height || interest.sender_height || null,
      education: String(interest.sender_profile_education || interest.sender_education || '').trim(),
      profileImages: profileImages.length > 0 ? profileImages : (profileImage ? [profileImage] : []),
      profileImage,
      compatibilityScore: 0,
      isVerified: false,
      lastActive: null,
      distance: null,
      mutualInterests: [],
      profileViews: 0,
      isOnline: false,
      motherTongue: '',
      interestStatus: interest.status,
      interestIsSender: false,
      interestId: String(interest.id),
      requestId: `${interest.id}`,
      timestamp: interest.created_at ? new Date(interest.created_at).toISOString() : null,
      message: interest.message || 'Hi, I found your profile interesting. Would like to connect.'
    };
  });

  return {
    success: true,
    data: {
      matches,
      requests: matches,
      totalCount,
      hasMore: parsedOffset + parsedLimit < totalCount
    }
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
