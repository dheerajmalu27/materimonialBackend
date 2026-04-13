import Joi from 'joi';

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const photoActionSchema = Joi.object({
  reason: Joi.string().max(500).allow(''),
});


export const settingsSchema = Joi.object({
  appName: Joi.string().max(100),
  bannerImage: Joi.string().uri(),
  notificationEnabled: Joi.boolean(),
}).min(1);

