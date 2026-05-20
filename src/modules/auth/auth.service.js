import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../../models/index.js';
import User from '../../models/user.model.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import UserProfile from '../../models/userProfile.model.js';
import { generateOTP } from '../../utils/otp.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import UserOtp from '../../models/userOtp.model.js';
import * as userService from '../../modules/user/user.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_HOUR = 5;

const OTP_TYPES = {
  MOBILE_VERIFICATION: 'MOBILE',
  RESET_PASSWORD_EMAIL: 'RESET_PASSWORD_EMAIL',
};

const buildOtpError = (message, statusCode = 400, code = 'OTP_ERROR', meta = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (meta) error.meta = meta;
  return error;
};

const createOtpForType = async (userId, type) => {
  const normalizedType = String(type || OTP_TYPES.MOBILE_VERIFICATION).toUpperCase();
  const now = Date.now();

  const latestOtp = await UserOtp.findOne({
    where: {
      userId,
      type: normalizedType,
    },
    order: [['created_at', 'DESC']],
  });

  if (latestOtp) {
    const lastSentAt = new Date(latestOtp.createdAt || latestOtp.created_at || 0).getTime();
    const elapsed = now - lastSentAt;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw buildOtpError(
        `Please wait ${retryAfterSec}s before requesting another OTP`,
        429,
        'OTP_RESEND_TOO_SOON',
        { retryAfterSec },
      );
    }
  }

  const oneHourAgo = new Date(now - (60 * 60 * 1000));
  const sentInLastHour = await UserOtp.count({
    where: {
      userId,
      type: normalizedType,
      createdAt: { [Op.gte]: oneHourAgo },
    },
  });

  if (sentInLastHour >= OTP_MAX_PER_HOUR) {
    throw buildOtpError(
      'OTP request limit reached. Please try again later.',
      429,
      'OTP_RATE_LIMIT_REACHED',
      { maxPerHour: OTP_MAX_PER_HOUR },
    );
  }

  await UserOtp.update(
    { isUsed: true },
    {
      where: {
        userId,
        type: normalizedType,
        isUsed: false,
      },
    },
  );

  const otp = generateOTP();
  await UserOtp.create({
    userId,
    otp,
    type: normalizedType,
    expiresAt: new Date(now + OTP_TTL_MS),
    isUsed: false,
  });

  return otp;
};

export const registerUser = async (payload) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, mobile, password, gender, profileData } = payload;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }]
      },
      transaction
    });

    if (existingUser) {
      throw new Error('Email or mobile already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        email,
        mobile,
        passwordHash: hashedPassword,
        gender,
        isActive: true,
        // Insert default settings on registration (Free baseline)
        settings: undefined,
      },
      { transaction }
    );

    // Initialize settings defaults (Free) if not already present
    try {
      // Lazy import to avoid circular deps
      const { defaultWebsiteSettingsByPlan } = await import('../user/defaultWebsiteSettings.js');
      if (!user.settings) {
        user.settings = defaultWebsiteSettingsByPlan.free;
        await user.save({ transaction });
      }
    } catch (e) {
      // If default settings init fails, do not block registration
      console.error('Failed to init default website settings on register:', e?.message || e);
    }

    if (profileData) {
      await userService.updateMyProfile(user.id, profileData, transaction);
    }

    await transaction.commit();

    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}








// export const registerUser = async (payload) => {
//   const { email, mobile, password, gender, profileData } = payload;

//   // No outer transaction - let updateMyProfile handle transactions internally
//   const existingUser = await User.findOne({
//     where: {
//       [Op.or]: [{ email }, { mobile }]
//     }
//   });

//   if (existingUser) {
//     throw new Error('Email or mobile already registered');
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const user = await User.create({
//     email,
//     mobile,
//     passwordHash: hashedPassword,
//     gender,
//     isActive: true
//   });

//   // Use existing updateMyProfile logic for full profile data
//   if (profileData) {
//     await userService.updateMyProfile(user.id, profileData);
//   }

//   return {
//     id: user.id,
//     email: user.email,
//     mobile: user.mobile,
//     gender: user.gender
//   };
// };

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email, isActive: true },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    gender: user.gender,
    mobile: user.mobile,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
    },
  };
};

/* LOGOUT */
export const logout = async () => true;

/* REFRESH TOKEN */
export const refreshToken = async (token) => {
   const payload = jwt.verify(token, env.jwt.jwtSecret);

  return generateToken({ id: payload.id });
};

/* SEND OTP */
export const sendOtp = async (userId, type) => {
  const otp = await createOtpForType(userId, type || OTP_TYPES.MOBILE_VERIFICATION);
  return otp;
};
/* VERIFY OTP */
export const verifyOtp = async (userId, otp, type) => {
  const normalizedType = String(type || OTP_TYPES.MOBILE_VERIFICATION).toUpperCase();
  const record = await UserOtp.findOne({
    where: {
      userId,
      type: normalizedType,
      isUsed: false
    },
    order: [['created_at', 'DESC']],
  });

  if (!record) {
    throw buildOtpError('Invalid OTP', 400, 'OTP_INVALID');
  }

  const now = Date.now();
  const expiresAt = new Date(record.expiresAt).getTime();

  if (now > expiresAt) {
    await record.update({ isUsed: true });
    throw buildOtpError('OTP expired', 400, 'OTP_EXPIRED');
  }

  if (String(record.otp) !== String(otp)) {
    throw buildOtpError('Invalid OTP', 400, 'OTP_INVALID');
  }

  record.isUsed = true;
  await record.save();

  return true;
};

/* FORGOT PASSWORD */
export const forgotPassword = async (email, type = 'EMAIL') => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return { sent: true };
  }

  const otpType = String(type).toUpperCase() === 'MOBILE'
    ? 'RESET_PASSWORD_MOBILE'
    : OTP_TYPES.RESET_PASSWORD_EMAIL;

  const otp = await createOtpForType(user.id, otpType);

  return { sent: true };
};

/* RESET PASSWORD */
export const resetPassword = async (email, otp, password) => {
  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) {
    throw new Error('Invalid request');
  }

  await verifyOtp(user.id, otp, OTP_TYPES.RESET_PASSWORD_EMAIL);

  const existingPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (existingPasswordMatch) {
    throw new Error('New password must be different from current password');
  }

  const hash = await bcrypt.hash(password, 10);
  await user.update({ passwordHash: hash });
};

/* CHANGE PASSWORD */
export const changePassword = async (userId, oldPass, newPass) => {
  const user = await User.findByPk(userId);
  const match = await bcrypt.compare(oldPass, user.passwordHash);
  if (!match) throw new Error('Wrong password');
  user.passwordHash = await bcrypt.hash(newPass, 10);
  await user.save();
};

