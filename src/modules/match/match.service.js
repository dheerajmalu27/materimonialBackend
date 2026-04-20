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

export const getBasicMatchSuggestions = async (userId, gender, limit = 20, offset = 0, city = null, filters = {}) => {
  try {
    // No PartnerPreference required - basic matching only

    // Default basic age range
    const DEFAULT_MIN_AGE = 21;
    const DEFAULT_MAX_AGE = 40;

    // 1️⃣ Build where conditions for candidates (same as original)
    const candidateWhere = {
      id: { [Op.ne]: userId },
      isActive: true,
      gender: { [Op.ne]: gender },
    };

    if (city) {
      candidateWhere['$profile.city$'] = city;
    }

    // 2️⃣ Fetch candidates (same includes)
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

    const normalizeFilterValues = (values) =>
      Array.isArray(values)
        ? values.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
        : [];

    const selectedReligions = normalizeFilterValues(filters.religion);
    const selectedCastes = normalizeFilterValues(filters.caste);
    const selectedLocations = normalizeFilterValues(filters.location);
    const selectedEducations = normalizeFilterValues(filters.education);
    const selectedOccupations = normalizeFilterValues(filters.occupation);
    const selectedIncomes = normalizeFilterValues(filters.income);

    const hasAnyMatch = (value, selectedValues) => {
      if (!selectedValues.length) return true;
      const normalizedValue = String(value || '').trim().toLowerCase();
      if (!normalizedValue) return false;
      return selectedValues.some((selected) => normalizedValue.includes(selected));
    };

    const buildCandidateLocation = (candidate, profile) => {
      const profileLocation = String(profile?.location || '').trim();
      if (profileLocation) return profileLocation;

      const primaryAddress = Array.isArray(candidate?.addresses) ? candidate.addresses[0] : null;
      if (!primaryAddress) return '';

      return [primaryAddress.city, primaryAddress.state, primaryAddress.country]
        .filter(Boolean)
        .join(', ');
    };

    // 3️⃣ Score candidates with basic logic (no strict preferences)
    for (const candidate of candidates) {
      const profile = candidate.profile;
      if (!profile) continue;

      const age = calculateAge(profile.dob);
      const locationValue = buildCandidateLocation(candidate, profile);

      // Apply basic filters from query params
      if (!hasAnyMatch(locationValue, selectedLocations)) continue;
      if (!hasAnyMatch(profile.religion, selectedReligions)) continue;
      if (!hasAnyMatch(profile.caste, selectedCastes)) continue;
      if (!hasAnyMatch(profile.education, selectedEducations)) continue;
      if (!hasAnyMatch(profile.occupation, selectedOccupations)) continue;
      if (!hasAnyMatch(profile.income, selectedIncomes)) continue;

      let score = 0;

      // 🎂 Basic age range (20 points)
      if (age !== null && age >= DEFAULT_MIN_AGE && age <= DEFAULT_MAX_AGE) {
        score += 20;
      }

      // 🛕 Religion match bonus (15)
      if (selectedReligions.length === 0 || hasAnyMatch(profile.religion, selectedReligions)) {
        score += 15;
      }

      // 📍 Location match (10)
      if (selectedLocations.length === 0 || hasAnyMatch(locationValue, selectedLocations)) {
        score += 10;
      }

      // 🎓 Education from filter (10)
      if (selectedEducations.length === 0 || hasAnyMatch(profile.education, selectedEducations)) {
        score += 10;
      }

      // 💼 Occupation from filter (10)
      if (selectedOccupations.length === 0 || hasAnyMatch(profile.occupation, selectedOccupations)) {
        score += 10;
      }

      // Mutual interests bonus (5)
      const mutualInterests = await getMutualInterests(userId, candidate.id);
      if (mutualInterests.length > 0) {
        score += 5;
      }

      // ✅ Min threshold for basic matches
      if (score >= 20) {
        const family = candidate.family;
        const lifestyle = candidate.lifestyle;
        const addresses = candidate.addresses || [];

        const interestStatus = await getInterestStatus(userId, candidate.id);
        const distance = await calculateDistance(userId, candidate.id, addresses);

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

    // 4️⃣ Sort, paginate (same as original)
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const totalCount = matches.length;
    const hasMore = totalCount > offset + limit;
    const paginatedMatches = matches.slice(offset, offset + limit);

    return {
      matches: paginatedMatches,
      totalCount,
      hasMore
    };
  } catch (error) {
    console.error('BASIC MATCH ERROR 👉', error);
    throw error;
  }
};

export const getMatchSuggestions = async (userId, gender, limit = 20, offset = 0, city = null, filters = {}) => {
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

    const parsePreferenceValues = (value) =>
      String(value || '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    const matchesPreferenceToken = (candidateValue, preferenceValues) => {
      if (!preferenceValues.length) return false;

      const normalizedCandidate = String(candidateValue || '').trim().toLowerCase();
      if (!normalizedCandidate) return false;

      const candidateTokens = normalizedCandidate
        .split(/[\-,/|]/)
        .map((token) => token.trim())
        .filter(Boolean);

      return preferenceValues.some(
        (prefValue) =>
          normalizedCandidate === prefValue ||
          candidateTokens.includes(prefValue)
      );
    };

    const preferredReligions = parsePreferenceValues(preference.religion);
    const preferredCastes = parsePreferenceValues(preference.caste);
    const preferredEducations = parsePreferenceValues(preference.education);
    const preferredOccupations = parsePreferenceValues(preference.occupation);
    const preferredIncomeRanges = parsePreferenceValues(preference.incomeRange);
    const preferredLocations = parsePreferenceValues(preference.location);
    const preferredMotherTongues = parsePreferenceValues(preference.motherTongue);

    const normalizeFilterValues = (values) =>
      Array.isArray(values)
        ? values.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)
        : [];

    const selectedReligions = normalizeFilterValues(filters.religion);
    const selectedCastes = normalizeFilterValues(filters.caste);
    const selectedLocations = normalizeFilterValues(filters.location);
    const selectedEducations = normalizeFilterValues(filters.education);
    const selectedOccupations = normalizeFilterValues(filters.occupation);
    const selectedIncomes = normalizeFilterValues(filters.income);

    const hasAnyMatch = (value, selectedValues) => {
      if (!selectedValues.length) return true;
      const normalizedValue = String(value || '').trim().toLowerCase();
      if (!normalizedValue) return false;
      return selectedValues.some((selected) => normalizedValue.includes(selected));
    };

    const buildCandidateLocation = (candidate, profile) => {
      const profileLocation = String(profile?.location || '').trim();
      if (profileLocation) return profileLocation;

      const primaryAddress = Array.isArray(candidate?.addresses) ? candidate.addresses[0] : null;
      if (!primaryAddress) return '';

      return [primaryAddress.city, primaryAddress.state, primaryAddress.country]
        .filter(Boolean)
        .join(', ');
    };

    // 4️⃣ Loop through candidates and calculate scores
    for (const candidate of candidates) {
      let score = 0;

      const profile = candidate.profile;

      if (!profile) continue;
      const age = calculateAge(profile.dob);
      const locationValue = buildCandidateLocation(candidate, profile);

      if (!hasAnyMatch(locationValue, selectedLocations)) continue;
      if (!hasAnyMatch(profile.religion, selectedReligions)) continue;
      if (!hasAnyMatch(profile.caste, selectedCastes)) continue;
      if (!hasAnyMatch(profile.education, selectedEducations)) continue;
      if (!hasAnyMatch(profile.occupation, selectedOccupations)) continue;
      if (!hasAnyMatch(profile.income, selectedIncomes)) continue;

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
      const religionMatched = matchesPreferenceToken(profile.religion, preferredReligions);
      const casteMatched = matchesPreferenceToken(profile.caste, preferredCastes);

      if (preferredReligions.length && preferredCastes.length) {
        if (religionMatched && casteMatched) {
          score += 20;
        }
      } else if (preferredReligions.length && religionMatched) {
        score += 10;
      } else if (preferredCastes.length && casteMatched) {
        score += 10;
      }

      // 🎓 Education (15)
      if (matchesPreferenceToken(profile.education, preferredEducations)) {
        score += 15;
      }

      // 💼 Occupation (15)
      if (matchesPreferenceToken(profile.occupation, preferredOccupations)) {
        score += 15;
      }

      // 📍 Location (10)
      if (matchesPreferenceToken(locationValue, preferredLocations)) {
        score += 10;
      }

      // 💰 Income Range (10)
      if (matchesPreferenceToken(profile.income, preferredIncomeRanges)) {
        score += 10;
      }

      // 🗣 Mother Tongue (5)
      if (matchesPreferenceToken(profile.motherTongue, preferredMotherTongues)) {
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
