import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserActivity from '../../models/userActivity.model.js';
import UserAddress from '../../models/userAddress.model.js';
import UserEducation from '../../models/userEducation.model.js';
import UserProfession from '../../models/userProfession.model.js';
import UserLifestyle from '../../models/userLifestyle.model.js';
import UserFamily from '../../models/userFamily.model.js';
import UserKundli from '../../models/userKundli.model.js'
import PartnerPreference from '../../models/partnerPreference.model.js';
import { calculateAge } from '../../utils/age.js';
import { Op } from 'sequelize';

/* ADMIN / PUBLIC */
export const getUserById = async (id) => {
  console.log('id'+id)
  return await User.findByPk(id, {
    attributes: { exclude: ['passwordHash'] },
    include: [{ model: UserProfile, as: 'profile' }]
  });
};

export const updateUserById = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error('User not found');
  await user.update(data);
  return user;
};

export const deleteUserById = async (id) => {
  await User.destroy({ where: { id } });
};

/* ME */
export const getMyProfile = async (userId) => {
  return await UserProfile.findOne({ where: { userId } });
};

export const updateMyProfile = async (userId, data) => {
  try {
    // Update UserProfile with personal, religion data
    const profileData = {};
    if (data.personal) {
      profileData.firstName = data.personal.firstName;
      profileData.lastName = data.personal.lastName;
      profileData.dob = data.personal.dateOfBirth;
      profileData.birthTime = data.personal.birthTime;
      profileData.heightCm = data.personal.heightCm;
      profileData.weightKg = data.personal.weightKg;
      profileData.maritalStatus = data.personal.maritalStatus;
      profileData.motherTongue = data.personal.motherTongue;
      profileData.aboutMe = data.personal.aboutMe;
      profileData.profileImage = data.personal.profileImage;
    }
    if (data.religion) {
      profileData.religion = data.religion.religion;
      profileData.caste = data.religion.caste;
      profileData.subCaste = data.religion.subCaste;
      profileData.gotra = data.religion.gotra;
      profileData.manglik = data.religion.manglik;
    }
    if (Object.keys(profileData).length > 0) {
      await UserProfile.upsert({ userId, ...profileData }, { returning: false });
    }

    // Update UserProfession
    if (data.professional) {
      const professionData = {
        userId,
        occupationType: data.professional.occupation,
        annualIncome: data.professional.annualIncome,
        workingCountry: data.professional.workLocation,
        companyOrBusiness: data.professional.employer
      };
      await UserProfession.upsert(professionData, { returning: false });
    }

    // Update UserFamily
    if (data.family) {
      const familyData = {
        userId,
        fatherName: data.family.fatherName,
        fatherOccupationType: data.family.fatherOccupation,
        motherName: data.family.motherName,
        motherOccupationType: data.family.motherOccupation,
        familyType: data.family.familyType,
        familyValues: data.family.familyValues,
        familyStatus: data.family.familyStatus
      };
      await UserFamily.upsert(familyData, { returning: false });
    }

    // Update UserLifestyle
    if (data.lifestyle) {
      const lifestyleData = {
        userId,
        diet: data.lifestyle.diet,
        smoking: data.lifestyle.smoking,
        drinking: data.lifestyle.drinking,
        hobbies: Array.isArray(data.lifestyle.hobbies) ? data.lifestyle.hobbies.join(',') : data.lifestyle.hobbies,
        interests: Array.isArray(data.lifestyle.interests) ? data.lifestyle.interests.join(',') : data.lifestyle.interests
      };
      await UserLifestyle.upsert(lifestyleData, { returning: false });
    }

    // Update UserAddress (delete existing and insert new)
    if (data.addresses && Array.isArray(data.addresses)) {
      await UserAddress.destroy({ where: { userId } });
      const addressInserts = data.addresses.map(addr => ({
        userId,
        addressType: addr.type,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        pincode: addr.pincode
      }));
      if (addressInserts.length > 0) {
        await UserAddress.bulkCreate(addressInserts);
      }
    }

    // Update UserEducation (delete existing and insert new)
    if (data.education && Array.isArray(data.education)) {
      await UserEducation.destroy({ where: { userId } });
      const educationInserts = data.education.map(edu => ({
        userId,
        qualification: edu.degree,
        college: edu.college,
        university: edu.university,
        passingYear: edu.yearOfPassing,
        highest: edu.highest || false
      }));
      if (educationInserts.length > 0) {
        await UserEducation.bulkCreate(educationInserts);
      }
    }

    // Update UserKundli
    if (data.kundli) {
      const kundliData = {
        userId,
        dob: data.personal.dateOfBirth|| null,
        birthPlace: data.kundli.birthPlace || null,
        birthTime: data.kundli.birthTime || null,
        nakshatra: data.kundli.nakshatra || null,
        manglik: data.kundli.manglik === '' || data.kundli.manglik === null ? false : Boolean(data.kundli.manglik),
        gotra: data.kundli.gotra || null,
        rashi: data.kundli.rashi || null,
        charan: data.kundli.charan === '' || data.kundli.charan === null ? 0 : parseInt(data.kundli.charan, 10),
        gan: data.kundli.gan || null,
        nadi: data.kundli.nadi || null
      };
      await UserKundli.upsert(kundliData, { returning: false });
    }

    // Update PartnerPreference
    if (data.partnerPreferences) {
      await PartnerPreference.upsert({ userId, ...data.partnerPreferences }, { returning: false });
    }

    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

export const getMySettings = async (userId) => {
  const user = await User.findByPk(userId);
  return user.settings || {};
};

export const updateMySettings = async (userId, settings) => {
  const user = await User.findByPk(userId);
  user.settings = settings;
  await user.save();
  return user.settings;
};

export const getMyActivity = async (userId) => {
  return await UserActivity.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 20
  });
};

export const deactivateAccount = async (userId) => {
  await User.update({ isActive: false }, { where: { id: userId } });
};

export const reactivateAccount = async (userId) => {
  await User.update({ isActive: true }, { where: { id: userId } });
};

/**
 * Get homepage profiles with three different lists
 * Returns three lists of 10 users each:
 * 1. Recently added users (opposite gender)
 * 2. Preference match users (opposite gender, matching partner preferences)
 * 3. Same city users (opposite gender, same city)
 */
export const getHomePageProfiles = async (userId) => {
  // Get current user details
  const currentUser = await User.findByPk(userId, {
    include: [
      { model: UserProfile, as: 'profile' },
      { model: UserAddress, as: 'addresses' },
      { model: PartnerPreference, as: 'partnerPreference' }
    ]
  });

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Determine opposite gender
  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

  // Get current user's present address city
  const presentAddress = currentUser.addresses?.find(addr => addr.addressType === 'present' || addr.addressType === 'both');
console.log(presentAddress);
  // Base where conditions for opposite gender and active users
  const baseWhereConditions = {
    id: { [Op.ne]: userId }, // Exclude current user
    gender: oppositeGender,
    isActive: true
  };

  // Helper function to format user data
  const formatUserData = (user) => {
    const profile = user.profile;
    const presentAddr = user.addresses.find(addr => addr.addressType === 'present' || addr.addressType === 'both');
    const education = user.education?.[0]; // Get first education record

    return {
      id: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      age: calculateAge(profile.dob),
      height: profile.heightCm,
      currentCity: presentAddr?.city,
      currentState: presentAddr?.state,
      education: education ? {
        degree: education.highestDegree,
        college: education.college,
        specialization: education.specialization
      } : null,
      photo: null // TODO: Add photo field when available
    };
  };

  // 1. RECENTLY ADDED USERS (opposite gender, ordered by creation date)
  const recentlyAddedUsers = await User.findAll({
    where: baseWhereConditions,
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: true
      },
      {
        model: UserAddress,
        as: 'addresses',
        required: false
      },
      {
        model: UserEducation,
        as: 'education',
        required: false
      }
    ],
    order: [['createdAt', 'DESC']], // Recently added first
    limit: 10
  });

  // 2. PREFERENCE MATCH USERS (opposite gender, matching partner preferences)
  let preferenceMatchUsers = [];
  if (currentUser.partnerPreference) {
    const prefs = currentUser.partnerPreference;
    const prefWhereConditions = { ...baseWhereConditions };

    // Apply preference filters
    if (prefs.minHeight && prefs.maxHeight) {
      prefWhereConditions['$profile.height_cm$'] = {
        [Op.between]: [prefs.minHeight, prefs.maxHeight]
      };
    }

    if (prefs.religion) {
      prefWhereConditions['$profile.religion$'] = prefs.religion;
    }

    if (prefs.maritalStatus) {
      prefWhereConditions['$profile.marital_status$'] = prefs.maritalStatus;
    }

    preferenceMatchUsers = await User.findAll({
      where: prefWhereConditions,
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: true
        },
        {
          model: UserAddress,
          as: 'addresses',
          required: false
        },
        {
          model: UserEducation,
          as: 'education',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Apply age filter in JavaScript if preferences exist
    if (prefs.minAge && prefs.maxAge) {
      preferenceMatchUsers = preferenceMatchUsers.filter(user => {
        const age = calculateAge(user.profile.dob);
        return age >= prefs.minAge && age <= prefs.maxAge;
      }).slice(0, 10);
    }
  }
console.log(preferenceMatchUsers)
  // 3. SAME CITY USERS (opposite gender, same city as current user)
  let sameCityUsers = [];
  if (presentAddress) {
    sameCityUsers = await User.findAll({
      where: baseWhereConditions,
      include: [
        {
          model: UserProfile,
          as: 'profile',
          required: true
        },
        {
          model: UserAddress,
          as: 'addresses',
          where: {
            [Op.or]: [
              { addressType: 'present' },
              { addressType: 'both' }
            ],
            city: presentAddress.city // Same city as current user
          },
          required: true
        },
        {
          model: UserEducation,
          as: 'education',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
  }

  return {
    success: true,
    data: {
      recentlyAdded: recentlyAddedUsers.map(formatUserData),
      preferenceMatches: preferenceMatchUsers.map(formatUserData),
      sameCity: sameCityUsers.map(formatUserData)
    }
  };
};

/**
 * Get recently added user profiles with pagination
 * @param {number} userId - Current user ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of records per page (default: 10)
 */
export const getRecentlyAddedProfiles = async (userId, page = 1, limit = 10) => {
  const currentUser = await User.findByPk(userId);
  if (!currentUser) {
    throw new Error('User not found');
  }

  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where: {
      id: { [Op.ne]: userId },
      gender: oppositeGender,
      isActive: true
    },
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: true
      },
      {
        model: UserAddress,
        as: 'addresses',
        required: false
      },
      {
        model: UserEducation,
        as: 'education',
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const formatUserData = (user) => {
    const profile = user.profile;
    const presentAddr = user.addresses.find(addr => addr.addressType === 'present' || addr.addressType === 'both');
    const education = user.education?.[0];

    return {
      id: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      age: calculateAge(profile.dob),
      height: profile.heightCm,
      currentCity: presentAddr?.city,
      currentState: presentAddr?.state,
      education: education ? {
        degree: education.highestDegree,
        college: education.college,
        specialization: education.specialization
      } : null,
      photo: null
    };
  };

  return {
    success: true,
    data: rows.map(formatUserData),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalRecords: count,
      limit
    }
  };
};

/**
 * Get preference match user profiles with pagination
 * @param {number} userId - Current user ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of records per page (default: 10)
 */
export const getPreferenceMatchProfiles = async (userId, page = 1, limit = 10) => {
  const currentUser = await User.findByPk(userId, {
    include: [{ model: PartnerPreference, as: 'partnerPreference' }]
  });

  if (!currentUser) {
    throw new Error('User not found');
  }

  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';
  const offset = (page - 1) * limit;

  let whereConditions = {
    id: { [Op.ne]: userId },
    gender: oppositeGender,
    isActive: true
  };

  // Apply preference filters
  if (currentUser.partnerPreference) {
    const prefs = currentUser.partnerPreference;

    if (prefs.minHeight && prefs.maxHeight) {
      whereConditions['$profile.height_cm$'] = {
        [Op.between]: [prefs.minHeight, prefs.maxHeight]
      };
    }

    if (prefs.religion) {
      whereConditions['$profile.religion$'] = prefs.religion;
    }

    if (prefs.maritalStatus) {
      whereConditions['$profile.marital_status$'] = prefs.maritalStatus;
    }
  }

  const { count, rows } = await User.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: true
      },
      {
        model: UserAddress,
        as: 'addresses',
        required: false
      },
      {
        model: UserEducation,
        as: 'education',
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  // Apply age filter in JavaScript if preferences exist
  let filteredRows = rows;
  if (currentUser.partnerPreference?.minAge && currentUser.partnerPreference?.maxAge) {
    const prefs = currentUser.partnerPreference;
    filteredRows = rows.filter(user => {
      const age = calculateAge(user.profile.dob);
      return age >= prefs.minAge && age <= prefs.maxAge;
    });
  }

  const formatUserData = (user) => {
    const profile = user.profile;
    const presentAddr = user.addresses.find(addr => addr.addressType === 'present' || addr.addressType === 'both');
    const education = user.education?.[0];

    return {
      id: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      age: calculateAge(profile.dob),
      height: profile.heightCm,
      currentCity: presentAddr?.city,
      currentState: presentAddr?.state,
      education: education ? {
        degree: education.highestDegree,
        college: education.college,
        specialization: education.specialization
      } : null,
      photo: null
    };
  };

  return {
    success: true,
    data: filteredRows.map(formatUserData),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalRecords: count,
      limit
    }
  };
};

/**
 * Get same city user profiles with pagination
 * @param {number} userId - Current user ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Number of records per page (default: 10)
 */
export const getSameCityProfiles = async (userId, page = 1, limit = 10) => {
  const currentUser = await User.findByPk(userId, {
    include: [{ model: UserAddress, as: 'addresses' }]
  });

  if (!currentUser) {
    throw new Error('User not found');
  }

  const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';
  const presentAddress = currentUser.addresses?.find(addr => addr.addressType === 'present' || addr.addressType === 'permanent'|| addr.addressType === 'both');

  if (!presentAddress) {
    return {
      matches: [],
      totalCount: 0,
      hasMore: false
    };
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where: {
      id: { [Op.ne]: userId },
      gender: oppositeGender,
      isActive: true
    },
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: true
      },
      {
        model: UserAddress,
        as: 'addresses',
        where: {
          [Op.or]: [
            { addressType: 'present' },
            { addressType: 'permanent' },
            { addressType: 'both' }
          ],
          city: presentAddress.city
        },
        required: true
      },
      {
        model: UserEducation,
        as: 'education',
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  const matches = rows.map(user => {
    const profile = user.profile;
    const presentAddr = user.addresses.find(addr => addr.addressType === 'present' ||addr.addressType === 'permanent'|| addr.addressType === 'both');
    const education = user.education?.[0];

    return {
      id: `${user.id}`,
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      age: calculateAge(profile.dob) || 0,
      location: `${presentAddr?.city || ''}, ${presentAddr?.state || ''}`.trim().replace(/^,|,$/g, ''),
      occupation: profile.occupation || '',
      bio: profile.aboutMe || '',
      religion: profile.religion || '',
      caste: profile.caste || '',
      height: profile.heightCm ? `${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}\"` : '',
      education: education?.highestDegree || '',
      profileImage: profile.profileImage || '',
      isVerified: user.isVerified || false,
      lastActive: user.updatedAt ? user.updatedAt.toISOString() : null
    };
  });

  const totalCount = count;
  const hasMore = totalCount > offset + limit;

  return {
    matches,
    totalCount,
    hasMore
  };
};

export const getUserProfileById = async (userId) => {
  return await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] },
    include: [
      {
        model: UserProfile,
        as: 'profile',
        required: true
      },
      {
        model: UserAddress,
        as: 'addresses',
        required: false
      },
      {
        model: UserEducation,
        as: 'education',
        required: false
      },
      {
        model: UserProfession,
        as: 'profession',
        required: false
      },
      {
        model: UserLifestyle,
        as: 'lifestyle',
        required: false
      },
      {
        model: UserFamily,
        as: 'family',
        required: false
      },
      {
        model: PartnerPreference,
        as: 'partnerPreference',
        required: false
      }
    ]
  });
};
