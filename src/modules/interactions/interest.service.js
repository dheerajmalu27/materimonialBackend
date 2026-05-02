import Interest from '../../models/interest.model.js';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserAddress from '../../models/userAddress.model.js';
import { Op } from 'sequelize';
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
  const { count, rows } = await Interest.findAndCountAll({
    where: { senderId: userId },
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'email', 'isActive'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'education',
              'location',
              'occupation',
              'profileImage',
              'profileImages'
            ]
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: {
              addressType: { [Op.in]: ['present', 'both'] }
            },
            required: false
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const requests = rows.map((interest) => {
    const receiver = interest.receiver;
    const profile = receiver?.profile;
    const addresses = receiver?.addresses || [];
    const primaryAddress = addresses[0];

    const city = String(primaryAddress?.city || '').trim();
    const state = String(primaryAddress?.state || '').trim();
    const cityStateLocation = `${city}${city && state ? ', ' : ''}${state}`.trim();
    const profileLocation = String(profile?.location || '').trim();

    // Calculate age from dob
    let age = null;
    if (profile?.dob) {
      const birthDate = new Date(profile.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      id: `${interest.id}`,
      recipient: {
        id: `${receiver?.id}`,
        name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
        age,
        location: profileLocation || cityStateLocation,
        occupation: String(profile?.occupation || '').trim(),
        height: profile?.heightCm || null,
        profileImage: profile?.profileImage || null
      },
      message: 'Hi, I found your profile interesting. Would like to connect.',
      timestamp: interest.createdAt ? new Date(interest.createdAt).toISOString() : null,
      status: interest.status
    };
  });

  return {
    success: true,
    data: {
      requests,
      totalCount: count,
      hasMore: offset + limit < count
    }
  };
};

export const getReceivedInterests = async (userId, limit = 20, offset = 0) => {
  const parsedLimit = Number.isFinite(limit) ? Math.max(1, limit) : 20;
  const parsedOffset = Number.isFinite(offset) ? Math.max(0, offset) : 0;

  const { count, rows } = await Interest.findAndCountAll({
    where: { receiverId: userId },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'email', 'isActive'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'education',
              'location',
              'occupation',
              'aboutMe',
              'religion',
              'caste',
              'profileImage',
              'profileImages',
              'motherTongue'
            ]
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: {
              addressType: { [Op.in]: ['present', 'both'] }
            },
            required: false
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset: parsedOffset
  });

  const matches = rows.map((interest) => {
    const sender = interest.sender;
    const profile = sender?.profile;
    const addresses = sender?.addresses || [];
    const primaryAddress = addresses[0];

    let profileImages = [];
    if (typeof profile?.profileImages === 'string' && profile.profileImages.trim()) {
      try {
        const parsedImages = JSON.parse(profile.profileImages);
        if (Array.isArray(parsedImages)) {
          profileImages = parsedImages.filter(Boolean).map((image) => String(image));
        }
      } catch (error) {
        profileImages = [];
      }
    }

    const city = String(primaryAddress?.city || '').trim();
    const state = String(primaryAddress?.state || '').trim();
    const cityStateLocation = `${city}${city && state ? ', ' : ''}${state}`.trim();
    const profileLocation = String(profile?.location || '').trim();
    const location = profileLocation || cityStateLocation;

    const firstName = String(profile?.firstName || '').trim();
    const lastName = String(profile?.lastName || '').trim();
    const displayName = `${firstName}${firstName && lastName ? ' ' : ''}${lastName}`.trim() || 'Unknown';

    const profileImage = String(
      profile?.profileImage
      || (profileImages.length > 0 ? profileImages[0] : '')
      || ''
    );

    // Calculate age from dob
    let age = 0;
    if (profile?.dob) {
      const birthDate = new Date(profile.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      id: String(sender?.id),
      name: displayName,
      age: Number(age || 0),
      location: location || null,
      occupation: String(profile?.occupation || '').trim(),
      bio: String(profile?.aboutMe || '').trim(),
      religion: String(profile?.religion || '').trim(),
      caste: String(profile?.caste || '').trim(),
      height: profile?.heightCm || null,
      education: String(profile?.education || '').trim(),
      profileImages: profileImages.length > 0 ? profileImages : (profileImage ? [profileImage] : []),
      profileImage,
      compatibilityScore: 0,
      isVerified: false,
      lastActive: null,
      distance: null,
      mutualInterests: [],
      profileViews: 0,
      isOnline: false,
      motherTongue: String(profile?.motherTongue || '').trim(),
      interestStatus: interest.status,
      interestIsSender: false,
      interestId: String(interest.id),
      requestId: `${interest.id}`,
      timestamp: interest.createdAt ? new Date(interest.createdAt).toISOString() : null,
      message: interest.message || 'Hi, I found your profile interesting. Would like to connect.'
    };
  });

  return {
    success: true,
    data: {
      matches,
      requests: matches,
      totalCount: count,
      hasMore: parsedOffset + parsedLimit < count
    }
  };
};

export const getMutualInterests = async (userId) => {
  // Get interests where user is sender and status is accepted (accepted by receiver)
  const acceptedByReceiver = await Interest.findAll({
    where: {
      senderId: userId,
      status: 'accepted'
    },
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'education',
              'profileImage'
            ]
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: {
              addressType: { [Op.in]: ['present', 'both'] }
            },
            required: false
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Get interests where user is receiver and status is accepted (accepted by me)
  const acceptedByMe = await Interest.findAll({
    where: {
      receiverId: userId,
      status: 'accepted'
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'education',
              'profileImage'
            ]
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: {
              addressType: { [Op.in]: ['present', 'both'] }
            },
            required: false
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Helper to calculate age
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format acceptedByReceiver results
  const receiverResults = acceptedByReceiver.map((interest) => {
    const receiver = interest.receiver;
    const profile = receiver?.profile;
    const addresses = receiver?.addresses || [];
    const primaryAddress = addresses[0];

    return {
      id: interest.id,
      status: interest.status,
      created_at: interest.createdAt,
      receiver_id: receiver?.id,
      receiver_first_name: profile?.firstName,
      receiver_last_name: profile?.lastName,
      receiver_age: calculateAge(profile?.dob),
      receiver_height: profile?.heightCm,
      receiver_education: profile?.education,
      receiver_is_active: receiver?.isActive,
      receiver_city: primaryAddress?.city,
      receiver_state: primaryAddress?.state,
      receiver_photo: profile?.profileImage,
      accepted_by: 'user'
    };
  });

  // Format acceptedByMe results
  const meResults = acceptedByMe.map((interest) => {
    const sender = interest.sender;
    const profile = sender?.profile;
    const addresses = sender?.addresses || [];
    const primaryAddress = addresses[0];

    return {
      id: interest.id,
      status: interest.status,
      created_at: interest.createdAt,
      sender_id: sender?.id,
      sender_first_name: profile?.firstName,
      sender_last_name: profile?.lastName,
      sender_age: calculateAge(profile?.dob),
      sender_height: profile?.heightCm,
      sender_education: profile?.education,
      sender_is_active: sender?.isActive,
      sender_city: primaryAddress?.city,
      sender_state: primaryAddress?.state,
      sender_photo: profile?.profileImage,
      accepted_by: 'me'
    };
  });

  // Combine results
  const mutualInterests = [...receiverResults, ...meResults];

  return {
    success: true,
    data: mutualInterests
  };
};

