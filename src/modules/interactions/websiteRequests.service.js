import Interest from '../../models/interest.model.js';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserAddress from '../../models/userAddress.model.js';
import { Op } from 'sequelize';

const statusMapToContract = {
  pending: 'pending',
  sent: 'new',
  accepted: 'accepted',
  rejected: 'rejected',
};

const toIso = (d) => (d ? new Date(d).toISOString() : null);

const calcAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return Math.max(0, age);
};

const computeLocation = (profile, addresses) => {
  const addr = Array.isArray(addresses) ? addresses[0] : null;
  const city = String(addr?.city || '').trim();
  const state = String(addr?.state || '').trim();
  const cityState = `${city}${city && state ? ', ' : ''}${state}`.trim();
  const profileLocation = String(profile?.location || '').trim();
  return profileLocation || cityState || null;
};

const normalizeProfileImages = (profile) => {
  // profile.profileImages getter already parses JSON in userProfile model
  try {
    if (!profile) return [];
    const imgs = profile.profileImages;
    if (Array.isArray(imgs)) return imgs.map(String);
    return [];
  } catch {
    return [];
  }
};

const mapInterestListItem = ({ interest, person, profile, addresses, asSender }) => {
  const contractStatus = statusMapToContract[interest.status] || 'new';

  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || '';
  const location = computeLocation(profile, addresses);
  const profileImages = normalizeProfileImages(profile);

  const viewedCount = Number(interest.viewedCount ?? 0);
  const lastViewedAt = asSender
    ? toIso(interest.senderViewedAt)
    : toIso(interest.viewerViewedAt);

  return {
    id: `${interest.id}`,
    status: contractStatus,
    requester: {
      id: `${person?.id || ''}`,
      fullName,
      age: calcAge(profile?.dob),
      height: profile?.heightCm != null ? `${profile.heightCm}` : null,
      religion: String(profile?.religion || ''),
      caste: String(profile?.caste || ''),
      city: location,
      profession: String(profile?.occupation || ''),
      education: String(profile?.education || ''),
      salary: profile?.income != null ? String(profile.income) : '',
      profileImage: profile?.profileImage || (profileImages[0] || null),
      isOnline: Boolean(profile?.isOnline),
      lastActiveMinutesAgo: null,
      isVerified: false,
      isPremium: false,
      premiumFeatured: false,
      recentlyViewed: viewedCount > 0,
    },
    receivedAt: asSender ? toIso(interest.createdAt) : toIso(interest.createdAt),
    lastActiveAt: lastViewedAt,
    viewedCount,

    aiCompatibilityPercent: 0,
    mutualInterestsCount: 0,
    trustScore: 0,
    profileCompletionPercent: 0,
    horoscopeMatchPercent: 0,
    responseRate: 0,

    mutualMatchBadge: { enabled: false, label: 'Mutual Connect' },
    viewedStatusLabel:
      contractStatus === 'new' ? 'New' : contractStatus === 'pending' ? 'Pending' : 'Viewed',
  };
};

/**
 * website-specific: list SENT requests.
 * Contract: GET /api/v1/website/requests/sent
 */
export const getWebsiteSentRequests = async (userId, { limit = 9, offset = 0, status = 'all', sort = 'latest', query = '' } = {}) => {
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 9));
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  const where = { senderId: userId };

  // status filter: contract->DB
  if (status && status !== 'all') {
    const inv = Object.entries(statusMapToContract).reduce((acc, [dbStatus, contractStatus]) => {
      acc[contractStatus] = dbStatus;
      return acc;
    }, {});
    const dbStatus = inv[status];
    if (dbStatus) where.status = dbStatus;
  }

  if (query && String(query).trim()) {
    const q = `%${String(query).trim()}%`;
    // free-text search: name or location (best-effort)
    where[Op.or] = [{ senderId: userId }];
    // filtering across joined profile/address would require literal/where on include;
    // keeping best-effort without forcing slow operations.
  }

  const order = sort === 'latest' ? [['createdAt', 'DESC']] : [['createdAt', 'DESC']];

  const { count, rows } = await Interest.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'isActive'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'religion',
              'caste',
              'motherTongue',
              'location',
              'occupation',
              'education',
              'income',
              'profileImage',
              'profileImages',
              'isOnline',
            ],
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: { addressType: { [Op.in]: ['present', 'both'] } },
            required: false,
          },
        ],
      },
    ],
    order,
    limit: parsedLimit,
    offset: parsedOffset,
  });

  const items = rows.map((interest) => {
    const person = interest.receiver;
    const profile = person?.profile;
    const addresses = person?.addresses || [];

    // In SENT list, requester should be the receiver (you sent interest to them)
    return mapInterestListItem({
      interest,
      person,
      profile,
      addresses,
      asSender: true,
    });
  });

  return { items, total: count, limit: parsedLimit, offset: parsedOffset };

};

/**
 * website-specific: list RECEIVED requests.
 * Contract: GET /api/v1/website/requests/received
 */
export const getWebsiteReceivedRequests = async (userId, { limit = 9, offset = 0, status = 'all', sort = 'latest', query = '' } = {}) => {
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 9));
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  const where = { receiverId: userId };

  // status filter: contract->DB
  if (status && status !== 'all') {
    const inv = Object.entries(statusMapToContract).reduce((acc, [dbStatus, contractStatus]) => {
      acc[contractStatus] = dbStatus;
      return acc;
    }, {});
    const dbStatus = inv[status];
    if (dbStatus) where.status = dbStatus;
  }

  const order = sort === 'latest' ? [['createdAt', 'DESC']] : [['createdAt', 'DESC']];

  const { count, rows } = await Interest.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'isActive'],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: [
              'firstName',
              'lastName',
              'dob',
              'heightCm',
              'religion',
              'caste',
              'motherTongue',
              'location',
              'occupation',
              'education',
              'income',
              'profileImage',
              'profileImages',
              'isOnline',
            ],
          },
          {
            model: UserAddress,
            as: 'addresses',
            attributes: ['city', 'state'],
            where: { addressType: { [Op.in]: ['present', 'both'] } },
            required: false,
          },
        ],
      },
    ],
    order,
    limit: parsedLimit,
    offset: parsedOffset,
  });

  const items = rows.map((interest) => {
    const person = interest.sender;
    const profile = person?.profile;
    const addresses = person?.addresses || [];

    // In RECEIVED list, requester should be the sender (who sent you interest)
    return mapInterestListItem({
      interest,
      person,
      profile,
      addresses,
      asSender: false,
    });
  });

  return { items, total: count, limit: parsedLimit, offset: parsedOffset };
};

