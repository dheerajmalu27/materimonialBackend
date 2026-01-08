// src/modules/profile/profile.service.js

import User from '../../models/user.model.js';
import UserProfile from '../../models/userProfile.model.js';
import UserAddress from '../../models/userAddress.model.js';
import UserEducation from '../../models/userEducation.model.js';

/**
 * Get full profile of logged-in user
 */
export const getProfileByUserId = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'mobile', 'gender'],
    include: [
      {
        model: UserProfile,
        as: 'profile',
      },
      {
        model: UserAddress,
        as: 'addresses',
      },
      {
        model: UserEducation,
        as: 'education',
      }
    ]
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update / Create profile (UPSERT)
 */
export const updateProfile = async (userId, payload) => {
  // ------------------------
  // USER PROFILE
  // ------------------------
  const [profile, profileCreated] =
    await UserProfile.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId }
    });

  await profile.update({
    first_name: payload.first_name,
    last_name: payload.last_name,
    dob: payload.dob,
    birth_time: payload.birth_time,
    height_cm: payload.height_cm,
    weight_kg: payload.weight_kg,
    marital_status: payload.marital_status,
    religion: payload.religion,
    caste: payload.caste,
    mother_tongue: payload.mother_tongue,
    about_me: payload.about_me
  });

  // ------------------------
  // ADDRESS (OPTIONAL)
  // ------------------------
  if (payload.address) {
    const { present, permanent } = payload.address;

    // Helper to check if two addresses are identical
    const isSameAddress = (addr1, addr2) => {
      return addr1 && addr2 && addr1.city === addr2.city && addr1.state === addr2.state && addr1.country === addr2.country && addr1.pincode === addr2.pincode;
    };

    if (present && permanent && isSameAddress(present, permanent)) {
      // Same address, create/update one with 'both'
      const [address] = await UserAddress.findOrCreate({
        where: { user_id: userId, address_type: 'both' },
        defaults: { user_id: userId, address_type: 'both' }
      });

      await address.update({
        city: present.city,
        state: present.state,
        country: present.country,
        pincode: present.pincode
      });

      // Delete any existing 'present' or 'permanent' if they exist
      await UserAddress.destroy({ where: { user_id: userId, address_type: ['present', 'permanent'] } });
    } else {
      // Different or only one provided
      if (present) {
        const [address] = await UserAddress.findOrCreate({
          where: { user_id: userId, address_type: 'present' },
          defaults: { user_id: userId, address_type: 'present' }
        });

        await address.update({
          city: present.city,
          state: present.state,
          country: present.country,
          pincode: present.pincode
        });
      }

      if (permanent) {
        const [address] = await UserAddress.findOrCreate({
          where: { user_id: userId, address_type: 'permanent' },
          defaults: { user_id: userId, address_type: 'permanent' }
        });

        await address.update({
          city: permanent.city,
          state: permanent.state,
          country: permanent.country,
          pincode: permanent.pincode
        });
      }

      // Delete 'both' if it exists
      await UserAddress.destroy({ where: { user_id: userId, address_type: 'both' } });
    }
  }

  // ------------------------
  // EDUCATION (OPTIONAL)
  // ------------------------
  if (payload.education) {
    const [education] = await UserEducation.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId }
    });

    await education.update({
      highest_degree: payload.education.highest_degree,
      college: payload.education.college,
      specialization: payload.education.specialization,
      passing_year: payload.education.passing_year
    });
  }

  return getProfileByUserId(userId);
};
