import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(8).required(),
  gender: Joi.string().valid('male', 'female').required(),

  // 👇 Optional profile fields
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  dob: Joi.date().iso().optional(),
  birthTime: Joi.string().pattern(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).optional(),
  heightCm: Joi.number().integer().min(30).max(200).optional(),
  weightKg: Joi.number().integer().min(30).max(200).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});