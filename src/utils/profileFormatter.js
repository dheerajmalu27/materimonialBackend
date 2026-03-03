import { Op } from 'sequelize';
import Interest from '../models/interest.model.js';
import UserAddress from '../models/userAddress.model.js';
import { calculateAge } from './age.js';

/**
 * Calculate profile completion percentage
 * @param {Object} profile - User profile object
 * @param {Object} family - User family object
 * @param {Object} lifestyle - User lifestyle object
 * @returns {number} Profile completion percentage
 */
export const calculateProfileCompletion = (profile, family, lifestyle) => {
  let filled = 0;
  const total = 10;

  // Profile fields
  if (profile?.firstName) filled++;
  if (profile?.lastName) filled++;
  if (profile?.dob) filled++;
  if (profile?.heightCm) filled++;
  if (profile?.religion) filled++;
  if (profile?.caste) filled++;
  if (profile?.motherTongue) filled++;
  if (profile?.aboutMe) filled++;

  // Family fields
  if (family?.fatherName) filled++;
  if (family?.motherName) filled++;

  // Lifestyle fields
  if (lifestyle?.diet) filled++;

  return Math.round((filled / total) * 100);
};

/**
 * Get mutual interests between two users
 * @param {number} userId - Current user ID
 * @param {number} candidateId - Candidate user ID
 * @returns {Promise<Array>} Array of mutual interest IDs
 */
export const getMutualInterests = async (userId, candidateId) => {
  try {
    const userInterests = await Interest.findAll({
      where: {
        senderId: userId,
        status: 'accepted'
      }
    });

    const candidateInterests = await Interest.findAll({
      where: {
        senderId: candidateId,
        status: 'accepted'
      }
    });

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

/**
 * Get interest status between logged-in user and candidate
 * @param {number} userId - Current user ID
 * @param {number} candidateId - Candidate user ID
 * @returns {Promise<Object|null>} Interest status object with status, isSender, and interestId
 */
export const getInterestStatus = async (userId, candidateId) => {
  try {
    const sentInterest = await Interest.findOne({
      where: {
        senderId: userId,
        receiverId: candidateId
      }
    });

    if (sentInterest) {
      return {
        status: sentInterest.status,
        isSender: true,
        interestId: sentInterest.id
      };
    }

    const receivedInterest = await Interest.findOne({
      where: {
        senderId: candidateId,
        receiverId: userId
      }
    });

    if (receivedInterest) {
      return {
        status: receivedInterest.status,
        isSender: false,
        interestId: receivedInterest.id
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting interest status:', error);
    return null;
  }
};

/**
 * Calculate distance between two users
 * @param {number} userId - Current user ID
 * @param {number} candidateId - Candidate user ID
 * @param {Array} candidateAddresses - Candidate's addresses
 * @returns {Promise<string|null>} Distance description
 */
export const calculateDistance = async (userId, candidateId, candidateAddresses) => {
  try {
    const userAddress = await UserAddress.findOne({
      where: {
        userId: userId,
        addressType: { [Op.in]: ['present', 'both'] }
      }
    });

    if (!userAddress || !candidateAddresses || candidateAddresses.length === 0) {
      return null;
    }

    const candidateCity = candidateAddresses[0]?.city;

    if (userAddress.city && candidateCity && 
        userAddress.city.toLowerCase() === candidateCity.toLowerCase()) {
      return 'Same city';
    }

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

/**
 * Convert height from centimeters to feet and inches format
 * @param {number} heightCm - Height in centimeters
 * @returns {number} Height in centimeters (unchanged for API response)
 */
export const formatHeight = (heightCm) => {
  return heightCm || null;
};

const resolveLocation = (profile, addresses = []) => {
  const directLocation = String(
    profile?.location
      || profile?.dataValues?.location
      || ''
  ).trim();
  if (directLocation) {
    return directLocation;
  }

  const city = profile?.city || profile?.dataValues?.city || '';
  const state = profile?.state || profile?.dataValues?.state || '';
  const cityState = `${city}, ${state}`
    .trim()
    .replace(/^,|,$/g, '');
  if (cityState) {
    return cityState;
  }

  const primaryAddress = Array.isArray(addresses) && addresses.length > 0
    ? addresses[0]
    : null;
  const addressLocation = `${primaryAddress?.city || ''}, ${primaryAddress?.state || ''}`
    .trim()
    .replace(/^,|,$/g, '');

  return addressLocation || null;
};

/**
 * Format user profile for API response
 * Standardizes the response structure for both potential matches and same-city users
 * @param {Object} user - User database object
 * @param {number} userId - Current logged-in user's ID (for interest comparison)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Formatted profile object
 */
export const formatProfileForResponse = async (user, userId, options = {}) => {
  try {
    const profile = user.profile;
    const family = user.family;
    const lifestyle = user.lifestyle;
    const addresses = user.addresses || [];

    const age = calculateAge(profile?.dob);

    // Get additional data
    const profileCompletion = calculateProfileCompletion(profile, family, lifestyle);
    const mutualInterests = await getMutualInterests(userId, user.id);
    const interestStatus = await getInterestStatus(userId, user.id);
    const distance = await calculateDistance(userId, user.id, addresses);
    const profileViews = user.dataValues?.profileViews || 0;

    // Format response with all enhanced fields
    return {
      id: `${user.id}`,
      name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
      age: age || 0,
      location: resolveLocation(profile, addresses),
      occupation: profile?.occupation || '',
      bio: profile?.aboutMe || '',
      religion: profile?.religion || '',
      caste: profile?.caste || '',
      height: profile?.heightCm || null,
      education: profile?.education || '',
      // send full array if available, otherwise fall back to single image
      profileImages: profile?.profileImages || (profile?.profileImage ? [profile.profileImage] : []),
      profileImage: (profile?.profileImages && profile.profileImages.length > 0)
        ? profile.profileImages[0]
        : profile?.profileImage || '',
      compatibilityScore: options.compatibilityScore || 0,
      isVerified: user.isVerified || false,
      lastActive: user.lastActive ? user.lastActive.toISOString() : user.updatedAt?.toISOString() || null,
      // Enhanced fields
      distance: distance,
      mutualInterests: mutualInterests,
      profileViews: profileViews,
      isOnline: false, // Can be updated if online status is tracked separately
      familyType: family?.familyType || '',
      motherTongue: profile?.motherTongue || '',
      profileCompletePercentage: profileCompletion,
      // Interest tracking fields
      interestStatus: interestStatus?.status || null,
      interestIsSender: interestStatus?.isSender || null,
      interestId: interestStatus?.interestId || null
    };
  } catch (error) {
    console.error('Error formatting profile for response:', error);
    throw error;
  }
};

/**
 * Build standardized profile object for API response
 * This function builds the response object from already-available data without additional DB calls
 * @param {Object} data - Object containing profile data
 * @returns {Object} Formatted profile object with standard structure
 */
export const buildProfileObject = (data) => {
  const {
    user,
    profile,
    family = null,
    lifestyle = null,
    compatibilityScore = 0,
    distance = null,
    mutualInterests = [],
    profileViews = 0,
    interestStatus = null,
    age = 0
  } = data;

  const profileCompletion = calculateProfileCompletion(profile, family, lifestyle);

  return {
    id: `${user.id}`,
    name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim(),
    age: age || 0,
    location: resolveLocation(profile, user?.addresses || []),
    occupation: profile?.occupation || '',
    bio: profile?.aboutMe || '',
    religion: profile?.religion || '',
    caste: profile?.caste || '',
    height: profile?.heightCm || null,
    education: profile?.education || '',
    profileImages: profile?.profileImages || (profile?.profileImage ? [profile.profileImage] : []),
    profileImage: (profile?.profileImages && profile.profileImages.length > 0)
      ? profile.profileImages[0]
      : profile?.profileImage || '',
    compatibilityScore: compatibilityScore,
    isVerified: user.isVerified || false,
    lastActive: user.lastActive ? user.lastActive.toISOString() : user.updatedAt?.toISOString() || null,
    // Enhanced fields for consistency across all endpoints
    distance: distance,
    mutualInterests: mutualInterests,
    profileViews: profileViews,
    isOnline: false,
    familyType: family?.familyType || '',
    motherTongue: profile?.motherTongue || '',
    profileCompletePercentage: profileCompletion,
    // Interest tracking fields
    interestStatus: interestStatus?.status || null,
    interestIsSender: interestStatus?.isSender || null,
    interestId: interestStatus?.interestId || null
  };
};

export default {
  calculateProfileCompletion,
  getMutualInterests,
  getInterestStatus,
  calculateDistance,
  formatHeight,
  buildProfileObject,
  formatProfileForResponse
};
