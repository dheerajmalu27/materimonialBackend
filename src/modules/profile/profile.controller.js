import UserProfile from '../../models/userProfile.model.js';
import UserAddress from '../../models/userAddress.model.js';
import UserEducation from '../../models/userEducation.model.js';
import { calculateProfileCompletion } from '../../utils/profileCompletion.js';
import * as profileService from './profile.service.js';
import { logActivity } from '../../utils/activityLogger.js';
export const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await UserProfile.findOne({ where: { userId } });
    const addresses = await UserAddress.findAll({ where: { userId } });
    const address = addresses.length > 0 ? addresses[0] : null;
    const education = await UserEducation.findOne({ where: { userId } });

    const completionPercentage = calculateProfileCompletion({
      profile,
      address,
      education
    });

    return res.status(200).json({
      success: true,
      completionPercentage
    });
  } catch (error) {
    console.error('PROFILE COMPLETION ERROR 👉', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate profile completion'
    });
  }
};



export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId)
    const profile = await profileService.getProfileByUserId(userId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await profileService.updateProfile(
      userId,
      req.body
    );
    logActivity({userId: req.user.id,action: 'PROFILE_UPDATE', description: 'Profile updated'});
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

