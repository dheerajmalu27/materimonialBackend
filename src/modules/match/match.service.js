import { Op } from 'sequelize';
import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import PartnerPreference from '../../models/partnerPreference.model.js';
import UserKundli from '../../models/userKundli.model.js';
import { matchKundli } from '../../utils/kundliMatcher.js';
import { calculateAge } from '../../utils/age.js';
export const getMatchSuggestions = async (userId,gender) => {
  try {
    // 1️⃣ Get partner preference
    const preference = await PartnerPreference.findOne({
      where: { userId }
    });

    if (!preference) {
      throw new Error('Partner preferences not set');
    }

    // 2️⃣ Fetch candidates
    const candidates = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        isActive: true,
        gender: { [Op.ne]: gender },
      },
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
   
    // 3️⃣ Loop through candidates
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
      console.log(profile);
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
        matches.push({
          userId: candidate.id,
          name: `${profile.firstName} ${profile.lastName}`,
          score
        });
      }
    }

    // 4️⃣ Sort by score DESC
    return matches.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('MATCH SUGGESTION ERROR 👉', error);
    throw error;
  }
};
