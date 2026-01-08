import { registerUser, loginUser } from './auth.service.js';
import * as service from './auth.service.js';
import { logActivity } from '../../utils/activityLogger.js';
export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('REGISTER ERROR 👉', error.message); // 🔥 IMPORTANT
    console.error(error); // full error
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body);
    logActivity({userId: data.user.id,action: 'LOGIN',description: 'User logged in',req});
    res.json({
      success: true,
      message: 'Login successful',
      data,
    });
    
  } catch (error) {
    next(error);
  }
};

export const logout = async (_, res) =>
  res.json({ success: true });

export const refreshToken = async (req, res) => {
  const token = await service.refreshToken(req.body.refreshToken);
  res.json({ accessToken: token });
};

export const sendOtp = async (req, res) => {
  await service.sendOtp(req.user.id,'Mobile');
  res.json({ message: 'OTP sent' });
};

export const verifyOtp = async (req, res) => {
  await service.verifyOtp(req.user.id, req.body.otp,'Mobile');
  res.json({ message: 'Verified' });
};

export const forgotPassword = async (req, res) => {
  await service.forgotPassword(req.body.email,'EMAIL');
  res.json({ message: 'OTP sent' });
};

export const resetPassword = async (req, res) => {
  await service.resetPassword(req.body.email, req.body.otp, req.body.password);
  res.json({ message: 'Password reset' });
};

export const changePassword = async (req, res) => {
  await service.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
  res.json({ message: 'Password changed' });
};

export const me = async (req, res) => {
  res.json(req.user);
};
