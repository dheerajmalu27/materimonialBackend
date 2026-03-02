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
export const registerUser = async (payload) => {
  const {
    email,
    mobile,
    password,
    gender,

    // Optional profile fields
    firstName,
    lastName,
    dob,
    birthTime,
    heightCm,
    weightKg
  } = payload;

  return await sequelize.transaction(async (t) => {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { mobile }]
      },
      transaction: t
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
        isActive: true
      },
      { transaction: t }
    );

    // 🧾 Create profile with optional fields
    await UserProfile.create(
      {
        userId: user.id,
        firstName: firstName || null,
        lastName: lastName || null,
        dob: dob || null,
        birthTime: birthTime || null,
        heightCm: heightCm || null,
        weightKg: weightKg || null,
        phone: mobile || null
      },
      { transaction: t }
    );

    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender
    };
  });
};

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
   console.log(token);
   console.log(env.jwt.jwtSecret);
   const payload = jwt.verify(token, env.jwt.jwtSecret);

  return generateToken({ id: payload.id });
};

/* SEND OTP */
export const sendOtp = async (userId, type) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await UserOtp.create({
    userId,          // ✅ REQUIRED
    otp,
    type,            // ✅ REQUIRED (LOGIN / RESET_PASSWORD / VERIFY_EMAIL)
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });


  return otp; // send via SMS/Email
};
/* VERIFY OTP */
export const verifyOtp = async (userId, otp, type) => {
  const record = await UserOtp.findOne({
    where: {
      userId,
      otp,
      type,
      isUsed: false
    }
  });
console.log(record.expiresAt)
  if (!record) throw new Error('Invalid OTP');
   const now = Date.now(); // milliseconds
  const expiresAt = new Date(record.expiresAt).getTime();
  console.log(now)
console.log(expiresAt);
  if (expiresAt > now) {
    throw new Error('OTP expired');
  }
  record.isUsed = true;
  await record.save();

  return true;
};

/* FORGOT PASSWORD */
export const forgotPassword = async (email,type) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return;
  const otp = generateOTP();
  await UserOtp.create({
    userId,          // ✅ REQUIRED
    otp,
    type,            // ✅ REQUIRED (LOGIN / RESET_PASSWORD / VERIFY_EMAIL)
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });
  console.log('Reset OTP:', otp);
};

/* RESET PASSWORD */
export const resetPassword = async (email, otp, password) => {
  const user = await User.findOne({ where: { email, resetOtp: otp } });
  if (!user) throw new Error('Invalid OTP');
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

