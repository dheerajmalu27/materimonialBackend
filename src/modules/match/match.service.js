import { Op, literal } from 'sequelize';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import PartnerPreference from '../../models/partnerPreference.model.js';
import UserKundli from '../../models/userKundli.model.js';
import UserAddress from '../../models/userAddress.model.js';
import UserFamily from '../../models/userFamily.model.js';
import UserLifestyle from '../../models/userLifestyle.model.js';
import Interest from '../../models/interest.model.js';
import ProfileView from '../../models/profileView.model.js';
import { matchKundli } from '../../utils/kundliMatcher.js';
import { calculateAge } from '../../utils/age.js';
import {
  calculateProfileCompletion,
  getMutualInterests,
  getInterestStatus,
  calculateDistance,
  buildProfileObject
} from '../../utils/profileFormatter.js';

export const getMatchSuggestions = async (userId, gender, limit = 20, offset = 0, city = null) => {
  try {
    // 1️⃣ Get partner preference
    const preference = await PartnerPreference.findOne({
      where: { userId }
    });

    if (!preference) {
      throw new Error('Partner preferences not set');
    }

    // 2️⃣ Build where conditions for candidates
    const candidateWhere = {
      id: { [Op.ne]: userId },
      isActive: true,
      gender: { [Op.ne]: gender },
    };

    // Add city filter if provided
    if (city) {
      candidateWhere['$profile.city$'] = city;
    }

    // 3️⃣ Fetch candidates with profile, kundli and additional data
    const candidates = await User.findAll({
      where: candidateWhere,
      include: [
        {
          model: UserProfile,
          as: 'profile'
        },
        {
          model: UserKundli,
          as: 'kundli',
          required: false
        },
        {
          model: UserAddress,
          as: 'addresses',
          required: false,
          where: {
            addressType: { [Op.in]: ['present', 'both'] }
          }
        },
        {
          model: UserFamily,
          as: 'family',
          required: false
        },
        {
          model: UserLifestyle,
          as: 'lifestyle',
          required: false
        }
      ],
      attributes: {
        include: [
          // Profile view count
          [
            literal(`(
              SELECT COUNT(*)
              FROM profile_views pv
              WHERE pv.viewed_user_id = "User"."id"
            )`),
            'profileViews'
          ]
        ]
      }
    });

    const matches = [];

    // 4️⃣ Loop through candidates and calculate scores
    for (const candidate of candidates) {
      let score = 0;

      const profile = candidate.profile;

      if (!profile) continue;
      const age = calculateAge(profile.dob);

      // 🎂 Age (25)
      if (
        age !== null &&
        preference.minAge &&
        preference.maxAge &&
        age >= preference.minAge &&
        age <= preference.maxAge
      ) {
       score += 25;
      }

      // 📏 Height (15)
      if (
        preference.minHeightCm &&
        preference.maxHeightCm &&
        profile.heightCm >= preference.minHeightCm &&
        profile.heightCm <= preference.maxHeightCm
      ) {
        score += 15;
      }

      // 🛕 Religion & Caste (20)
      if (
        preference.religion &&
        preference.caste &&
        profile.religion === preference.religion &&
        profile.caste === preference.caste
      ) {
        score += 20;
      }

      // 🎓 Education (15)
      if (
        preference.education &&
        profile.education === preference.education
      ) {
        score += 15;
      }

      // 💼 Occupation (15) - NEW - check if candidate's occupation matches preference
      if (
        preference.occupation &&
        profile.occupation &&
        profile.occupation.toLowerCase().includes(preference.occupation.toLowerCase())
      ) {
        score += 15;
      }

      // 📍 Location (10)
      if (
        (preference.city && profile.city === preference.city) ||
        (preference.state && profile.state === preference.state)
      ) {
        score += 10;
      }

      // 🗣 Mother Tongue (5)
      if (
        preference.motherTongue &&
        profile.motherTongue === preference.motherTongue
      ) {
        score += 5;
      }

      // 🔮 Kundli Matching (10)
      if (preference.kundliMatchRequired) {
        const userKundli = await UserKundli.findOne({
          where: { userId }
        });

        const candidateKundli = candidate.kundli;

        if (!userKundli || !candidateKundli) continue;

        const kundliResult = matchKundli(
          userKundli,
          candidateKundli
        );

        if (!kundliResult.allowed) continue;

        score += 10;
      }

      // ✅ Minimum score threshold
      if (score >= 10) {
        // Get additional data
        const family = candidate.family;
        const lifestyle = candidate.lifestyle;
        const addresses = candidate.addresses || [];

        // Get mutual interests
        const mutualInterests = await getMutualInterests(userId, candidate.id);

        // Get interest status between logged-in user and candidate
        const interestStatus = await getInterestStatus(userId, candidate.id);

        // Calculate distance (simplified - using same city for now)
        const distance = await calculateDistance(userId, candidate.id, addresses);

        // Build standardized profile object
        const profileObject = buildProfileObject({
          user: candidate,
          profile: profile,
          family: family,
          lifestyle: lifestyle,
          compatibilityScore: score,
          distance: distance,
          mutualInterests: mutualInterests,
          profileViews: candidate.dataValues?.profileViews || 0,
          interestStatus: interestStatus,
          age: age
        });

        matches.push(profileObject);
      }
    }

    // 5️⃣ Sort by score DESC
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // 6️⃣ Calculate total count and hasMore
    const totalCount = matches.length;
    const hasMore = totalCount > offset + limit;

    // 7️⃣ Apply pagination
    const paginatedMatches = matches.slice(offset, offset + limit);

    return {
      matches: paginatedMatches,
      totalCount,
      hasMore
    };
  } catch (error) {
    console.error('MATCH SUGGESTION ERROR 👉', error);
    throw error;
  }
};
