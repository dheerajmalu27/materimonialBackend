import { registerUser, loginUser } from './auth.service.js';
import * as service from './auth.service.js';
import { logActivity } from '../../utils/activityLogger.js';
export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      }
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
    await logActivity({
      userId: data.user.id,
      action: 'AUTH_LOGIN',
      description: {
        type: 'auth',
        event: 'login_success',
      },
      req,
      markRequestAsLogged: true,
    });
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: data.user.id,
        email: data.user.email,
        name: data.user.email, // TODO: Get from profile
        accessToken: data.token,
        refreshToken: data.refreshToken || null,
        expiresIn: 3600
      }
    });

  } catch (error) {
    next(error);
  }
};

export const logout = async (_, res) =>
  res.json({ success: true });

export const refreshToken = async (req, res) => {
  const token = await service.refreshToken(req.body.refreshToken);
  res.json({
    success: true,
    data: {
      accessToken: token,
      expiresIn: 3600
    }
  });
};

export const sendOtp = async (req, res) => {
  try {
    await service.sendOtp(req.user.id, 'MOBILE');
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || 'Failed to send OTP',
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.meta ? { data: error.meta } : {}),
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    await service.verifyOtp(req.user.id, req.body.otp, 'MOBILE');
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || 'OTP verification failed',
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.meta ? { data: error.meta } : {}),
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await service.forgotPassword(req.body.email, 'EMAIL');
    res.json({ success: true, message: 'If the email exists, OTP has been sent.' });
  } catch (error) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || 'Failed to process forgot password request',
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.meta ? { data: error.meta } : {}),
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await service.resetPassword(req.body.email, req.body.otp, req.body.newPassword || req.body.password);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || 'Failed to reset password',
      ...(error?.code ? { code: error.code } : {}),
      ...(error?.meta ? { data: error.meta } : {}),
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    await service.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(error?.statusCode || 400).json({
      success: false,
      message: error?.message || 'Failed to change password',
    });
  }
};

export const me = async (req, res) => {
  res.json(req.user);
};
