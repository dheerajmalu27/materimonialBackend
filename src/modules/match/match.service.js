import { Op } from 'sequelize';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import PartnerPreference from '../../models/partnerPreference.model.js';
import UserKundli from '../../models/userKundli.model.js';
import { matchKundli } from '../../utils/kundliMatcher.js';
import { calculateAge } from '../../utils/age.js';
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

    // 3️⃣ Fetch candidates with profile and kundli
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
        }
      ]
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
        // Convert height to feet and inches
        const heightInFeet = profile.heightCm ? `${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}\"` : '';

        matches.push({
          id: `${candidate.id}`,
          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
          age: age || 0,
          location: `${profile.city || ''}, ${profile.state || ''}`.trim().replace(/^,|,$/g, ''),
          occupation: profile.occupation || '',
          bio: profile.aboutMe || '',
          religion: profile.religion || '',
          caste: profile.caste || '',
          height: heightInFeet,
          education: profile.education || '',
          profileImage: profile.profileImage || '',
          compatibilityScore: score,
          isVerified: candidate.isVerified || false,
          lastActive: candidate.updatedAt ? candidate.updatedAt.toISOString() : null
        });
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
