import * as service from './user.service.js';
import { calculateAge } from '../../utils/age.js';
import { getInterestStatus } from '../../utils/profileFormatter.js';

const parseFamilyMeta = (family) => {
  const raw = family?.familyNativePlace;
  if (!raw || typeof raw !== 'string') {
    return { siblings: '', familyValues: '', familyStatus: '' };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      siblings: parsed?.siblings || '',
      familyValues: parsed?.familyValues || '',
      familyStatus: parsed?.familyStatus || ''
    };
  } catch (error) {
    return { siblings: '', familyValues: '', familyStatus: '' };
  }
};

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
    
    const userData = await service.getUserProfileById(req.user.id);
    const user = req.user;
    const profile = userData.profile;
    const addresses = userData.addresses || [];
    const education = userData.education || [];
    const lifestyle = userData.lifestyle;
    const family = userData.family;
    const familyMeta = parseFamilyMeta(family);
    const kundli = userData.kundli;
    const partnerPreference = userData.partnerPreference;

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
      manglik: kundli.manglik ?? null,
      gotra: kundli.gotra || '',
      rashi: kundli.rashi || '',
      nakshatra: kundli.nakshatra || '',
      charan: kundli.charan || '',
      gan: kundli.gan || '',
      nadi: kundli.nadi || '',
      // Add more kundli fields as needed
    } : null;

    // normalize hobbies/interests into arrays
    const normalizedHobbies = lifestyle && typeof lifestyle.hobbies === 'string'
      ? (lifestyle.hobbies ? lifestyle.hobbies.split(',').map(h => h.trim()).filter(Boolean) : [])
      : lifestyle?.hobbies || [];
    const normalizedInterests = lifestyle && typeof lifestyle.interests === 'string'
      ? (lifestyle.interests ? lifestyle.interests.split(',').map(i => i.trim()).filter(Boolean) : [])
      : lifestyle?.interests || [];

    // Format the comprehensive response
    const formattedProfile = {
      // Basic Information
      id: user.id.toString(),
      email: user.email || '',
      mobile: user.mobile || profile?.phone || '',
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
        // provide full images array and primary image
        profileImages: profile?.profileImages || (profile?.profileImage ? [profile.profileImage] : []),
        profileImage: (profile?.profileImages && profile.profileImages.length > 0) ? profile.profileImages[0] : profile?.profileImage || null,
        lastActive: user.updatedAt
      },

      // Religious & Cultural
      religion: {
        religion: profile?.religion || '',
        caste: profile?.caste || '',
        subCaste: profile?.subCaste || '',
        gotra: profile?.gotra || '',
        manglik: kundli?.manglik ?? profile?.manglik ?? null
      },

      // Professional
      professional: {
        occupation: userData?.profession?.occupationType || profile?.occupation || '',
        annualIncome: userData?.profession?.annualIncome || profile?.income || '',
        workLocation: userData?.profession?.workingCountry || '',
        employer: userData?.profession?.companyOrBusiness || ''
      },

      // Education
      education: formattedEducation,

      // Addresses
      addresses: formattedAddresses,

      // Family Information
      family: {
        fatherName: family?.fatherName || '',
        fatherOccupation: family?.fatherOccupation || '',
        motherName: family?.motherName || '',
        motherOccupation: family?.motherOccupation || '',
        siblings: family?.siblings || familyMeta.siblings || '',
        familyType: family?.familyType || '',
        familyValues: family?.familyValues || familyMeta.familyValues || '',
        familyStatus: family?.familyStatus || familyMeta.familyStatus || ''
      },

      // Lifestyle
      lifestyle: {
        diet: lifestyle?.diet || '',
        smoking: lifestyle?.smoking || null,
        drinking: lifestyle?.drinking || null,
        hobbies: normalizedHobbies,
        interests: normalizedInterests
      },

      // Kundli/Horoscope
      kundli: formattedKundli,
      
      // Partner Preferences (if viewing own profile)
      partnerPreference: partnerPreference // TODO: Add partner preferences if needed
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
  try {
    await service.updateMyProfile(req.user.id, req.body);

    // Return fresh formatted profile after update
    const userData = await service.getUserProfileById(req.user.id);
    const user = userData; // userData contains user and related models
    const profile = user.profile;
    const addresses = user.addresses || [];
    const education = user.education || [];
    const lifestyle = user.lifestyle;
    const family = user.family;
    const familyMeta = parseFamilyMeta(family);
    const kundli = user.kundli;

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
      manglik: kundli.manglik ?? null,
      gotra: kundli.gotra || '',
      rashi: kundli.rashi || '',
      nakshatra: kundli.nakshatra || '',
      charan: kundli.charan || '',
      gan: kundli.gan || '',
      nadi: kundli.nadi || ''
    } : null;

    const normalizedHobbies = lifestyle && typeof lifestyle.hobbies === 'string'
      ? (lifestyle.hobbies ? lifestyle.hobbies.split(',').map(h => h.trim()).filter(Boolean) : [])
      : lifestyle?.hobbies || [];
    const normalizedInterests = lifestyle && typeof lifestyle.interests === 'string'
      ? (lifestyle.interests ? lifestyle.interests.split(',').map(i => i.trim()).filter(Boolean) : [])
      : lifestyle?.interests || [];

    const formattedProfile = {
      id: user.id.toString(),
      email: user.email,
      mobile: user.mobile || profile?.phone || '',
      gender: user.gender,
      isVerified: user.isVerified || false,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

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
        profileImages: profile?.profileImages || (profile?.profileImage ? [profile.profileImage] : []),
        profileImage: (profile?.profileImages && profile.profileImages.length > 0) ? profile.profileImages[0] : profile?.profileImage || null,
        lastActive: user.updatedAt
      },

      religion: {
        religion: profile?.religion || '',
        caste: profile?.caste || '',
        subCaste: profile?.subCaste || '',
      },

      professional: {
        occupation: user?.profession?.occupationType || profile?.occupation || '',
        annualIncome: user?.profession?.annualIncome || profile?.income || '',
        workLocation: user?.profession?.workingCountry || '',
        employer: user?.profession?.companyOrBusiness || ''
      },

      education: formattedEducation,
      addresses: formattedAddresses,

      family: {
        fatherName: family?.fatherName || '',
        fatherOccupation: family?.fatherOccupation || '',
        motherName: family?.motherName || '',
        motherOccupation: family?.motherOccupation || '',
        siblings: family?.siblings || familyMeta.siblings || '',
        familyType: family?.familyType || '',
        familyValues: family?.familyValues || familyMeta.familyValues || '',
        familyStatus: family?.familyStatus || familyMeta.familyStatus || ''
      },

      lifestyle: {
        diet: lifestyle?.diet || '',
        smoking: lifestyle?.smoking || null,
        drinking: lifestyle?.drinking || null,
        hobbies: normalizedHobbies,
        interests: normalizedInterests
      },

      kundli: formattedKundli,
      partnerPreference: user.partnerPreference
    };

    res.json({ success: true, data: formattedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// handle uploading one or multiple profile photos
export const uploadProfilePhotos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const userId = req.user.id;
    const host = req.get('host');
    const protocol = req.protocol;
    const urls = req.files.map(file => {
      // build publicly accessible URL
      return `${protocol}://${host}/uploads/${userId}/${file.filename}`;
    });

    // do not automatically update DB here; front-end can decide which image to set as profileImage
    // but for convenience, update the profileImages array if the service supports it
    await service.updateMyProfile(userId, {
      personal: {
        profileImages: urls,
        profileImage: urls[0] // set first image as main
      }
    });

    res.json({ success: true, data: { urls, profileImage: urls[0] } });
  } catch (error) {
    console.error('Upload error', error);
    res.status(500).json({ success: false, message: error.message });
  }
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
  
    const userData = await service.getUserProfileById(req.params.id);
    const interestStatus = await getInterestStatus(req.user.id, userData.id);
 

    const profile = userData.profile;
    const addresses = userData.addresses || [];
    const education = userData.education || [];
    const family = userData.family;
    const familyMeta = parseFamilyMeta(family);
    const lifestyle = userData.lifestyle;
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
      manglik: kundli.manglik ?? null,
      gotra: kundli.gotra || '',
      rashi: kundli.rashi || '',
      nakshatra: kundli.nakshatra || '',
      charan: kundli.charan || '',
      gan: kundli.gan || '',
      nadi: kundli.nadi || '',
      // Add more kundli fields as needed
    } : null;

    const normalizedHobbies = lifestyle && typeof lifestyle.hobbies === 'string'
      ? (lifestyle.hobbies ? lifestyle.hobbies.split(',').map(h => h.trim()).filter(Boolean) : [])
      : lifestyle?.hobbies || [];
    const normalizedInterests = lifestyle && typeof lifestyle.interests === 'string'
      ? (lifestyle.interests ? lifestyle.interests.split(',').map(i => i.trim()).filter(Boolean) : [])
      : lifestyle?.interests || [];

    // Format the comprehensive response
    const formattedProfile = {
      // Basic Information
      id: userData.id.toString(),
      email: userData.email,
      mobile: userData.mobile || profile?.phone || '',
      gender: userData.gender,
      isVerified: userData.isVerified || false,
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      interestStatus: interestStatus?.status || null,
      interestIsSender: interestStatus?.isSender || null,
      interestId: interestStatus?.interestId || null,

      // Personal Details
      personal: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        fullName: profile ? `${profile.firstName} ${profile.lastName}` : userData.email,
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
        lastActive: userData.updatedAt
      },

      // Religious & Cultural
      religion: {
        religion: profile?.religion || '',
        caste: profile?.caste || '',
        subCaste: profile?.subCaste || '',
        manglik: kundli?.manglik ?? profile?.manglik ?? null
       
      },

      // Professional
      professional: {
        occupation: userData?.profession?.occupationType || profile?.occupation || '',
        annualIncome: userData?.profession?.annualIncome || profile?.income || '',
        workLocation: userData?.profession?.workingCountry || '',
        employer: userData?.profession?.companyOrBusiness || ''
      },

      // Education
      education: formattedEducation,

      // Addresses
      addresses: formattedAddresses,

      // Family Information
      family: {
        fatherName: family?.fatherName || '',
        fatherOccupation: family?.fatherOccupation || '',
        motherName: family?.motherName || '',
        motherOccupation: family?.motherOccupation || '',
        siblings: family?.siblings || familyMeta.siblings || '',
        familyType: family?.familyType || '',
        familyValues: family?.familyValues || familyMeta.familyValues || '',
        familyStatus: family?.familyStatus || familyMeta.familyStatus || ''
      },

      // Lifestyle
      lifestyle: {
        diet: lifestyle?.diet || '',
        smoking: lifestyle?.smoking || null,
        drinking: lifestyle?.drinking || null,
        hobbies: normalizedHobbies,
        interests: normalizedInterests
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
