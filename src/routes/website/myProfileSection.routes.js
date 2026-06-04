import express from 'express';
import { authGuard } from '../../middlewares/auth.middleware.js';

// Reuse existing controller/service logic.
import * as userController from '../../modules/user/user.controller.js';

const router = express.Router();

/**
 * Helpers
 */
const sendUpdatedResponse = (req, res) => {
  // userController.updateMyProfile already returns `{ success: true, data: formattedProfile? }`
  // but in current code it returns `{ success: true, data: formattedProfile }`.
  // We just forward it.
  return userController.updateMyProfile(req, res);
};

/**
 * NOTE: section-wise routes are implemented as thin wrappers
 * around PUT /v1/user/me/profile by transforming request body
 * into the nested payload that `userController.updateMyProfile` expects.
 */

/** About Me */
router.put('/my-profile/section/about', authGuard, async (req, res, next) => {
  try {
    const { aboutMe } = req.body;
    req.body = {
      personal: {
        ...(aboutMe !== undefined ? { aboutMe } : {}),
      },
    };
    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

/** Basic Details */
router.put('/my-profile/section/basic', authGuard, async (req, res, next) => {
  try {
    const {
      heightCm,
      maritalStatus,
      motherTongue,
      religion,
      caste,
      dob,
      birthTime,
      manglik,
      gotra,
    } = req.body;

    req.body = {
      personal: {
        ...(heightCm !== undefined ? { heightCm } : {}),
        ...(maritalStatus !== undefined ? { maritalStatus } : {}),
        ...(motherTongue !== undefined ? { motherTongue } : {}),
        ...(dob !== undefined ? { dateOfBirth: dob } : {}),
        ...(birthTime !== undefined ? { birthTime } : {}),
      },
      religion: {
        ...(religion !== undefined ? { religion } : {}),
        ...(caste !== undefined ? { caste } : {}),
        ...(gotra !== undefined ? { gotra } : {}),
        // user.service.parseManglik handles yes/no/true/false too
        ...(manglik !== undefined ? { manglik } : {}),
      },
      kundli: {
        ...(manglik !== undefined ? { manglik } : {}),
      },
    };

    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

/** Career & Education */
router.put('/my-profile/section/career-education', authGuard, async (req, res, next) => {
  try {
    const { career, education } = req.body || {};

    const professional = {
      ...(career?.occupation !== undefined ? { occupation: career.occupation } : {}),
      ...(career?.employer !== undefined ? { employer: career.employer } : {}),
      ...(career?.annualIncome !== undefined ? { annualIncome: career.annualIncome } : {}),
      ...(career?.workLocation !== undefined ? { workLocation: career.workLocation } : {}),
    };

    // Backend expects education[] with { degree, college, university, yearOfPassing, highest }
    const educationArray = [];
    if (education) {
      educationArray.push({
        degree: education.highestEducation ?? education.degree ?? education.qualification,
        college: education.college,
        university: education.university ?? undefined,
        yearOfPassing: education.yearOfPassing ?? undefined,
        // highest boolean is required by schema; default to true if not passed.
        highest: education.highest ?? true,
      });

      // If client sends educationDetail, keep as `specialization`-like? Current backend mapping uses `educationDetail`
      // only on frontend demo. Here we ignore it unless your backend model stores it in some column.
      // (No matching SQL column exists in create_all_tables_mysql.sql)
    }

    req.body = {
      professional,
      // user.service.updateMyProfile checks `data.education` array.
      education: educationArray,
    };

    // user.service.updateMyProfile expects { professional: { occupationType/employer/... } }
    // but it normalizes various key names, so we pass through.
    return userController.updateMyProfile(req, res);
  } catch (e) {
    next(e);
  }
});

/** Family Details */
router.put('/my-profile/section/family', authGuard, async (req, res, next) => {
  try {
    const {
      familyType,
      fatherOccupation,
      motherOccupation,
      siblings,
      familyValues,
      fatherName,
      fatherMobile,
      motherName,
      motherMobile,
      familyStatus,
    } = req.body || {};

    req.body = {
      family: {
        ...(familyType !== undefined ? { familyType } : {}),
        ...(fatherOccupation !== undefined ? { fatherOccupation } : {}),
        ...(motherOccupation !== undefined ? { motherOccupation } : {}),
        ...(siblings !== undefined ? { siblings } : {}),
        ...(familyValues !== undefined ? { familyValues } : {}),
        // optional fields
        ...(fatherName !== undefined ? { fatherName } : {}),
        ...(fatherMobile !== undefined ? { fatherMobile } : {}),
        ...(motherName !== undefined ? { motherName } : {}),
        ...(motherMobile !== undefined ? { motherMobile } : {}),
        ...(familyStatus !== undefined ? { familyStatus } : {}),
      },
    };

    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

/** Lifestyle Details */
router.put('/my-profile/section/lifestyle', authGuard, async (req, res, next) => {
  try {
    const { diet, smoking, drinking, hobbies, interests } = req.body || {};

    req.body = {
      lifestyle: {
        ...(diet !== undefined ? { diet } : {}),
        ...(smoking !== undefined ? { smoking } : {}),
        ...(drinking !== undefined ? { drinking } : {}),
        ...(hobbies !== undefined ? { hobbies } : {}),
        ...(interests !== undefined ? { interests } : {}),
      },
    };

    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

/** Location Details */
router.put('/my-profile/section/location', authGuard, async (req, res, next) => {
  try {
    const {
      addressType,
      country,
      state,
      city,
      pincode,
      currentAddress,
      nativePlace,
    } = req.body || {};

    // Your SQL schema for user_addresses does NOT include a raw `address` column,
    // but your current `user.controller` expects `addr.address`.
    // This wrapper will send `address` only if your real model supports it.

    req.body = {
      addresses: [
        {
          type: addressType || 'present',
          country,
          state,
          city,
          pincode,
          // best-effort
          address: currentAddress ?? undefined,
        },
      ],
      kundli: {
        birthPlace: nativePlace ?? undefined,
      },
    };

    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

/** Partner Preferences */
router.put('/my-profile/section/partner-preferences', authGuard, async (req, res, next) => {
  try {
    const {
      ageMin,
      ageMax,
      minHeightCm,
      maxHeightCm,
      religion,
      caste,
      education,
      occupation,
      city,
      location,
      incomeRange,
      motherTongue,
      kundliMatchRequired,
      manglikPreference,
    } = req.body || {};

    req.body = {
      partnerPreferences: {
        ...(ageMin !== undefined ? { minAge: ageMin } : {}),
        ...(ageMax !== undefined ? { maxAge: ageMax } : {}),
        ...(minHeightCm !== undefined ? { minHeightCm } : {}),
        ...(maxHeightCm !== undefined ? { maxHeightCm } : {}),
        ...(religion !== undefined ? { religion } : {}),
        ...(caste !== undefined ? { caste } : {}),
        ...(education !== undefined ? { education } : {}),
        ...(occupation !== undefined ? { occupation } : {}),
        ...(city !== undefined ? { location: city } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(incomeRange !== undefined ? { incomeRange } : {}),
        ...(motherTongue !== undefined ? { motherTongue } : {}),
        ...(kundliMatchRequired !== undefined ? { kundliMatchRequired } : {}),
        ...(manglikPreference !== undefined ? { manglikPreference } : {}),
      },
    };

    return sendUpdatedResponse(req, res);
  } catch (e) {
    next(e);
  }
});

export default router;

