import * as service from './user.service.js';
import { calculateAge } from '../../utils/age.js';

/* ADMIN / PUBLIC */
export const getUserById = async (req, res) => {
   console.log("params")
  console.log(req.params)
  const user = await service.getUserById(req.params.id);
  res.json(user);
};

export const updateUserById = async (req, res) => {
  const user = await service.updateUserById(req.params.id, req.body);
  res.json(user);
};

export const deleteUserById = async (req, res) => {
  await service.deleteUserById(req.params.id);
  res.json({ message: 'User deleted' });
};

/* ME */
export const getMyProfile = async (req, res) => {
  try {
    console.log("getMyProfile");
    console.log(req.user);
    const userData = await service.getUserProfileById(req.user.id);
    const user = req.user;
    const profile = userData.profile;
    const addresses = userData.addresses || [];
    const education = userData.education || [];
    const kundli = userData.kundli;

    // Format addresses
    const formattedAddresses = addresses.map(addr => ({
      type: addr.addressType,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      pincode: addr.pincode
    }));

    // Format education
    const formattedEducation = education.map(edu => ({
      degree: edu.qualification,
      college: edu.college,
      university: edu.university,
      yearOfPassing: edu.passingYear,
      highest: edu.highest
    }));

    // Format kundli/horoscope
    const formattedKundli = kundli ? {
      birthPlace: kundli.birthPlace || '',
      birthTime: kundli.birthTime || '',
      manglik: kundli.manglik || '',
      gotra: kundli.gotra || '',
      rashi: kundli.rashi || '',
      nakshatra: kundli.nakshatra || '',
      charan: kundli.charan || '',
      gan: kundli.gan || '',
      nadi: kundli.nadi || '',
      // Add more kundli fields as needed
    } : null;

    // Format the comprehensive response
    const formattedProfile = {
      // Basic Information
      id: user.id.toString(),
      email: user.email || '',
      mobile: user.mobile || '',
      gender: user.gender || '',
      isVerified: user.isVerified || false,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Personal Details
      personal: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        fullName: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
        dateOfBirth: profile?.dob || null,
        age: profile ? calculateAge(profile.dob) : null,
        birthTime: profile?.birthTime || null,
        height: profile?.heightCm ? `${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}\"` : '',
        heightCm: profile?.heightCm || null,
        weight: profile?.weightKg ? `${profile.weightKg} kg` : '',
        weightKg: profile?.weightKg || null,
        maritalStatus: profile?.maritalStatus || '',
        motherTongue: profile?.motherTongue || '',
        aboutMe: profile?.aboutMe || '',
        profileImage: profile?.profileImage || null,
        lastActive: user.updatedAt
      },

      // Religious & Cultural
      religion: {
        religion: profile?.religion || '',
        caste: profile?.caste || '',
        subCaste: profile?.subCaste || '',
        gotra: profile?.gotra || '',
        manglik: profile?.manglik || null
      },

      // Professional
      professional: {
        occupation: profile?.occupation || '',
        annualIncome: profile?.annualIncome || '',
        workLocation: profile?.workLocation || '',
        employer: profile?.employer || ''
      },

      // Education
      education: formattedEducation,

      // Addresses
      addresses: formattedAddresses,

      // Family Information
      family: {
        fatherName: profile?.fatherName || '',
        fatherOccupation: profile?.fatherOccupation || '',
        motherName: profile?.motherName || '',
        motherOccupation: profile?.motherOccupation || '',
        siblings: profile?.siblings || '',
        familyType: profile?.familyType || '',
        familyValues: profile?.familyValues || '',
        familyStatus: profile?.familyStatus || ''
      },

      // Lifestyle
      lifestyle: {
        diet: profile?.diet || '',
        smoking: profile?.smoking || null,
        drinking: profile?.drinking || null,
        hobbies: profile?.hobbies || [],
        interests: profile?.interests || []
      },

      // Kundli/Horoscope
      kundli: formattedKundli,

      // Partner Preferences (if viewing own profile)
      partnerPreferences: null // TODO: Add partner preferences if needed
    };

    console.log(formattedProfile);
    res.json({
      success: true,
      data: formattedProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateMyProfile = async (req, res) => {
  const profile = await service.updateMyProfile(req.user.id, req.body);
  res.json(profile);
};

export const getMySettings = async (req, res) => {
  const settings = await service.getMySettings(req.user.id);
  res.json({
    success: true,
    data: settings
  });
};

export const updateMySettings = async (req, res) => {
  const settings = await service.updateMySettings(req.user.id, req.body);
  res.json(settings);
};

export const getMyActivity = async (req, res) => {
  const activity = await service.getMyActivity(req.user.id);
  res.json(activity);
};

export const deactivateAccount = async (req, res) => {
  await service.deactivateAccount(req.user.id);
  res.json({ message: 'Account deactivated' });
};

export const reactivateAccount = async (req, res) => {
  await service.reactivateAccount(req.user.id);
  res.json({ message: 'Account reactivated' });
};


export const getHomePageProfiles = async (req, res) => {
  try {
    const profiles = await service.getHomePageProfiles(req.user.id);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecentlyAddedProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await service.getRecentlyAddedProfiles(userId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPreferenceMatchProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await service.getPreferenceMatchProfiles(userId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSameCityProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await service.getSameCityProfiles(userId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfileById = async (req, res) => {
  try {
     console.log("params")
  console.log(req.params.id)
    const userData = await service.getUserProfileById(req.params.id);
 
    const user = await service.getUserById(req.params.id);

    const profile = userData.profile;
    const addresses = userData.addresses || [];
    const education = userData.education || [];
    const kundli = userData.kundli;

    // Format addresses
    const formattedAddresses = addresses.map(addr => ({
      type: addr.addressType,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      pincode: addr.pincode
    }));

    // Format education
    const formattedEducation = education.map(edu => ({
      degree: edu.qualification,
      college: edu.college,
      university: edu.university,
      yearOfPassing: edu.passingYear,
      highest: edu.highest
    }));

    // Format kundli/horoscope
    const formattedKundli = kundli ? {
      birthPlace: kundli.birthPlace || '',
      birthTime: kundli.birthTime || '',
      manglik: kundli.manglik || '',
      gotra: kundli.gotra || '',
      rashi: kundli.rashi || '',
      nakshatra: kundli.nakshatra || '',
      charan: kundli.charan || '',
      gan: kundli.gan || '',
      nadi: kundli.nadi || '',
      // Add more kundli fields as needed
    } : null;

    // Format the comprehensive response
    const formattedProfile = {
      // Basic Information
      id: user.id.toString(),
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      isVerified: user.isVerified || false,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Personal Details
      personal: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        fullName: profile ? `${profile.firstName} ${profile.lastName}` : user.email,
        dateOfBirth: profile?.dob || null,
        age: profile ? calculateAge(profile.dob) : null,
        birthTime: profile?.birthTime || null,
        height: profile?.heightCm ? `${Math.floor(profile.heightCm / 30.48)}'${Math.round((profile.heightCm % 30.48) / 2.54)}\"` : '',
        heightCm: profile?.heightCm || null,
        weight: profile?.weightKg ? `${profile.weightKg} kg` : '',
        weightKg: profile?.weightKg || null,
        maritalStatus: profile?.maritalStatus || '',
        motherTongue: profile?.motherTongue || '',
        aboutMe: profile?.aboutMe || '',
        profileImage: profile?.profileImage || null,
        lastActive: user.updatedAt
      },

      // Religious & Cultural
      religion: {
        religion: profile?.religion || '',
        caste: profile?.caste || '',
        subCaste: profile?.subCaste || '',
        gotra: profile?.gotra || '',
        manglik: profile?.manglik || null
      },

      // Professional
      professional: {
        occupation: profile?.occupation || '',
        annualIncome: profile?.annualIncome || '',
        workLocation: profile?.workLocation || '',
        employer: profile?.employer || ''
      },

      // Education
      education: formattedEducation,

      // Addresses
      addresses: formattedAddresses,

      // Family Information
      family: {
        fatherName: profile?.fatherName || '',
        fatherOccupation: profile?.fatherOccupation || '',
        motherName: profile?.motherName || '',
        motherOccupation: profile?.motherOccupation || '',
        siblings: profile?.siblings || '',
        familyType: profile?.familyType || '',
        familyValues: profile?.familyValues || '',
        familyStatus: profile?.familyStatus || ''
      },

      // Lifestyle
      lifestyle: {
        diet: profile?.diet || '',
        smoking: profile?.smoking || null,
        drinking: profile?.drinking || null,
        hobbies: profile?.hobbies || [],
        interests: profile?.interests || []
      },

      // Kundli/Horoscope
      kundli: formattedKundli,

      // Partner Preferences (if viewing own profile)
      partnerPreferences: null // TODO: Add partner preferences if needed
    };

    console.log(formattedProfile.kundli);
    res.json({
      success: true,
      data: formattedProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
