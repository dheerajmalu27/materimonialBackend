import Joi from 'joi';

export const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).required(),
    gender: Joi.string().valid('male', 'female').required(),

    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    dob: Joi.date().iso().optional(),
    birthTime: Joi.string().pattern(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
    heightCm: Joi.number().integer().min(30).max(250).optional(),
    weightKg: Joi.number().integer().min(20).max(250).optional(),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

export const verifyOtpSchema = {
  body: Joi.object({
    otp: Joi.string().pattern(/^[0-9]{6}$/).required(),
  }),
};

export const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().pattern(/^[0-9]{6}$/).required(),
    newPassword: Joi.string().min(8).required(),
    password: Joi.string().min(8).optional(),
  }),
};

export const changePasswordSchema = {
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};