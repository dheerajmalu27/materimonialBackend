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

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (profile, family, lifestyle) => {
  let filled = 0;
  const total = 10;

  // Profile fields
  if (profile.firstName) filled++;
  if (profile.lastName) filled++;
  if (profile.dob) filled++;
  if (profile.heightCm) filled++;
  if (profile.religion) filled++;
  if (profile.caste) filled++;
  if (profile.motherTongue) filled++;
  if (profile.aboutMe) filled++;

  // Family fields
  if (family && family.fatherName) filled++;
  if (family && family.motherName) filled++;

  // Lifestyle fields
  if (lifestyle && lifestyle.diet) filled++;

  return Math.round((filled / total) * 100);
};

// Helper function to get mutual interests between two users
const getMutualInterests = async (userId, candidateId) => {
  try {
    // Get interests sent by user
    const userInterests = await Interest.findAll({
      where: {
        senderId: userId,
        status: 'accepted'
      }
    });

    // Get interests sent by candidate
    const candidateInterests = await Interest.findAll({
      where: {
        senderId: candidateId,
        status: 'accepted'
      }
    });

    // Find mutual interests (users who liked each other)
    const userLikedIds = userInterests.map(i => i.receiverId);
    const mutualIds = candidateInterests
      .filter(i => userLikedIds.includes(i.receiverId))
      .map(i => i.receiverId);

    return mutualIds.length > 0 ? mutualIds : [];
  } catch (error) {
    console.error('Error getting mutual interests:', error);
    return [];
  }
};

// Helper function to calculate distance (simplified)
const calculateDistance = async (userId, candidateId, candidateAddresses) => {
  try {
    // Get user's address
    const userAddress = await UserAddress.findOne({
      where: {
        userId: userId,
        addressType: { [Op.in]: ['present', 'both'] }
      }
    });

    if (!userAddress || !candidateAddresses || candidateAddresses.length === 0) {
      return null; // Can't calculate distance without addresses
    }

    const candidateCity = candidateAddresses[0]?.city;

    // Simple logic: if same city, return "Same city"
    if (userAddress.city && candidateCity && 
        userAddress.city.toLowerCase() === candidateCity.toLowerCase()) {
      return 'Same city';
    }

    // If same state
    if (userAddress.state && candidateAddresses[0]?.state &&
        userAddress.state.toLowerCase() === candidateAddresses[0].state.toLowerCase()) {
      return 'Same state';
    }

    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

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
        const heightInFeet = profile.heightCm ? `${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}"` : '';

        // Get additional data
        const family = candidate.family;
        const lifestyle = candidate.lifestyle;
        const addresses = candidate.addresses || [];

        // Calculate profile completion percentage
        const profileCompletion = calculateProfileCompletion(profile, family, lifestyle);

        // Get mutual interests
        const mutualInterests = await getMutualInterests(userId, candidate.id);

        // Calculate distance (simplified - using same city for now)
        const distance = await calculateDistance(userId, candidate.id, addresses);

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
          lastActive: candidate.lastActive ? candidate.lastActive.toISOString() : candidate.updatedAt?.toISOString() || null,
          // Additional fields
          distance: distance,
          mutualInterests: mutualInterests,
          profileViews: candidate.dataValues?.profileViews || 0,
          isOnline: false, // Default to false since column doesn't exist
          familyType: family?.familyType || '',
          motherTongue: profile.motherTongue || '',
          profileCompletePercentage: profileCompletion
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

// Get match details for a specific profile - compares user's partner preferences with profile data
export const getMatchDetails = async (userId, profileUserId) => {
  try {
    // Get user's partner preferences
    const userPreferences = await PartnerPreference.findOne({
      where: { userId }
    });

    if (!userPreferences) {
      throw new Error('Partner preferences not set');
    }

    // Get profile user's details
    const profileUser = await User.findOne({
      where: { id: profileUserId },
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
      ]
    });

    if (!profileUser || !profileUser.profile) {
      throw new Error('Profile not found');
    }

    const profile = profileUser.profile;
    const age = calculateAge(profile.dob);

    // Calculate match details for each criteria
    const matchDetailsList = [];

    // Age (25 points)
    const ageMatch = age !== null && userPreferences.minAge && userPreferences.maxAge &&
                     age >= userPreferences.minAge && age <= userPreferences.maxAge;
    matchDetailsList.push({
      criteria: "Age",
      icon: "🎂",
      points: 25,
      matched: ageMatch,
      yourPreference: `${userPreferences.minAge || 'N/A'} - ${userPreferences.maxAge || 'N/A'} years`,
      theirValue: `${age || 'N/A'} years`,
    });

    // Height (15 points)
    const heightMatch = userPreferences.minHeightCm && userPreferences.maxHeightCm &&
                       profile.heightCm >= userPreferences.minHeightCm &&
                       profile.heightCm <= userPreferences.maxHeightCm;
    matchDetailsList.push({
      criteria: "Height",
      icon: "📏",
      points: 15,
      matched: heightMatch,
      yourPreference: `${userPreferences.minHeightCm || 'N/A'} - ${userPreferences.maxHeightCm || 'N/A'} cm`,
      theirValue: `${profile.heightCm || 'N/A'} cm`,
    });

    // Religion & Caste (20 points)
    const religionMatch = userPreferences.religion && profile.religion === userPreferences.religion;
    const casteMatch = userPreferences.caste && profile.caste === userPreferences.caste;
    const religionCasteMatch = religionMatch && casteMatch;
    matchDetailsList.push({
      criteria: "Religion & Caste",
      icon: "🛕",
      points: 20,
      matched: religionCasteMatch,
      yourPreference: `${userPreferences.religion || 'N/A'}, ${userPreferences.caste || 'N/A'}`,
      theirValue: `${profile.religion || 'N/A'}, ${profile.caste || 'N/A'}`,
    });

    // Occupation (15 points) - NEW
    const occupationMatch = userPreferences.occupation && profile.occupation &&
                           profile.occupation.toLowerCase().includes(userPreferences.occupation.toLowerCase());
    matchDetailsList.push({
      criteria: "Occupation",
      icon: "💼",
      points: 15,
      matched: occupationMatch,
      yourPreference: userPreferences.occupation || 'N/A',
      theirValue: profile.occupation || 'N/A',
    });

    // Education (15 points)
    const educationMatch = userPreferences.education && profile.education === userPreferences.education;
    matchDetailsList.push({
      criteria: "Education",
      icon: "🎓",
      points: 15,
      matched: educationMatch,
      yourPreference: userPreferences.education || 'N/A',
      theirValue: profile.education || 'N/A',
    });

    // Location (10 points)
    const locationMatch = (userPreferences.city && profile.city === userPreferences.city) ||
                         (userPreferences.state && profile.state === userPreferences.state);
    matchDetailsList.push({
      criteria: "Location",
      icon: "📍",
      points: 10,
      matched: locationMatch,
      yourPreference: `${userPreferences.city || 'N/A'}, ${userPreferences.state || 'N/A'}`,
      theirValue: `${profile.city || 'N/A'}, ${profile.state || 'N/A'}`,
    });

    // Mother Tongue (5 points)
    const motherTongueMatch = userPreferences.motherTongue && profile.motherTongue === userPreferences.motherTongue;
    matchDetailsList.push({
      criteria: "Mother Tongue",
      icon: "🗣",
      points: 5,
      matched: motherTongueMatch,
      yourPreference: userPreferences.motherTongue || 'N/A',
      theirValue: profile.motherTongue || 'N/A',
    });

    // Kundli Matching (10 points)
    let kundliMatch = false;
    if (userPreferences.kundliMatchRequired) {
      const userKundli = await UserKundli.findOne({ where: { userId } });
      const profileKundli = profileUser.kundli;

      if (userKundli && profileKundli) {
        const kundliResult = matchKundli(userKundli, profileKundli);
        kundliMatch = kundliResult.allowed;
      }
    }
    matchDetailsList.push({
      criteria: "Kundli Matching",
      icon: "🔮",
      points: 10,
      matched: kundliMatch,
      yourPreference: userPreferences.kundliMatchRequired ? "Required" : "Not Required",
      theirValue: profileUser.kundli ? "Available" : "Not Available",
    });

    // Calculate total score
    const totalScore = matchDetailsList.reduce((acc, detail) => acc + (detail.matched ? detail.points : 0), 0);
    const matchPercentage = Math.round((totalScore / 100) * 100);

    return {
      matchDetails: matchDetailsList,
      totalScore,
      matchPercentage,
      userPreferences: {
        minAge: userPreferences.minAge,
        maxAge: userPreferences.maxAge,
        minHeightCm: userPreferences.minHeightCm,
        maxHeightCm: userPreferences.maxHeightCm,
        religion: userPreferences.religion,
        caste: userPreferences.caste,
        occupation: userPreferences.occupation,
        education: userPreferences.education,
        city: userPreferences.city,
        state: userPreferences.state,
        motherTongue: userPreferences.motherTongue,
        kundliMatchRequired: userPreferences.kundliMatchRequired
      },
      profileDetails: {
        age,
        height: profile.heightCm,
        religion: profile.religion,
        caste: profile.caste,
        occupation: profile.occupation,
        education: profile.education,
        city: profile.city,
        state: profile.state,
        motherTongue: profile.motherTongue,
        hasKundli: !!profileUser.kundli
      }
    };
  } catch (error) {
    console.error('MATCH DETAILS ERROR 👉', error);
    throw error;
  }
};
