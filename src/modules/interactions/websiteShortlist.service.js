import { Op } from 'sequelize';

import Shortlist from '../../models/shortlist.model.js';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserAddress from '../../models/userAddress.model.js';

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

const mapShortlistItem = ({ shortlist, profile, addresses }) => {
  const location = computeLocation(profile, addresses);

  const familyType = '';
  const image = profile?.profileImage || null;

  // RecentlyViewed is best-effort since we don’t compute from view events here.
  // If later you add profile_view_events-based logic, plug it in.
  const recentlyViewed = false;

  return {
    id: shortlist.shortlistedUserId,
    name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
    age: calcAge(profile?.dob),
    height: profile?.heightCm != null ? `${profile.heightCm}` : null,
    religion: String(profile?.religion || ''),
    caste: String(profile?.caste || ''),
    city: location,
    profession: String(profile?.occupation || ''),
    education: String(profile?.education || ''),
    salary: profile?.income != null ? String(profile.income) : '',

    familyType,
    image,

    isOnline: Boolean(profile?.isOnline),
    lastActiveMinutesAgo: null,
    isRecentlyActive: false,

    isVerified: false,
    isPremium: false,
    premiumFeatured: false,
    isShortlistedHeart: true,

    aiCompatibilityPercent: 0,
    horoscopeMatchPercent: 0,
    trustScore: 0,
    profileCompletionPercent: 0,
    mutualInterestsCount: 0,

    savedAt: toIso(shortlist.createdAt),
    notes: shortlist.notes || null,
    favoriteLevel: shortlist.favoriteLevel || shortlist.favoriteLevel,
    recentlyViewed,
  };
};

export const getWebsiteShortlists = async (
  userId,
  { limit = 9, offset = 0, filter = 'all', sort = 'latestSaved', query = '' } = {}
) => {
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 9));
  const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

  // filter/sort/query are best-effort for MVP
  const where = { userId };

  const order = (() => {
    if (sort === 'recentlyViewed') return [['createdAt', 'DESC']];
    return [['createdAt', 'DESC']];
  })();

  // optional query: try to match profile name fields
  const q = String(query || '').trim();

  const { count, rows } = await Shortlist.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'shortlistedUser',
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
              'location',
              'occupation',
              'education',
              'income',
              'profileImage',
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

  // If associations for Shortlist->User are not defined, fallback to plain join-less mapping
  // (Sequelize will throw if missing include associations; in that case we retry without include.)
  let items;
  try {
    items = rows.map((shortlist) => {
      const person = shortlist.shortlistedUser;
      const profile = person?.profile;
      const addresses = person?.addresses || [];
      return mapShortlistItem({ shortlist, profile, addresses });
    });
  } catch {
    // Fallback: fetch only shortlisted user profiles by ids
    const shortlistedIds = rows.map((r) => r.shortlistedUserId);
    const users = await User.findAll({
      where: { id: { [Op.in]: shortlistedIds } },
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
            'location',
            'occupation',
            'education',
            'income',
            'profileImage',
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
    });

    const byId = new Map(users.map((u) => [String(u.id), u]));

    items = rows.map((shortlist) => {
      const person = byId.get(String(shortlist.shortlistedUserId));
      const profile = person?.profile;
      const addresses = person?.addresses || [];
      return mapShortlistItem({ shortlist, profile, addresses });
    });
  }

  return { items, total: count, limit: parsedLimit, offset: parsedOffset };
};

export const removeWebsiteShortlist = async (userId, shortlistedUserId) => {
  await Shortlist.destroy({ where: { userId, shortlistedUserId } });
  return { success: true };
};

