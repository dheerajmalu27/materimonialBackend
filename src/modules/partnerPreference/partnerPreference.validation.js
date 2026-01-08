import Joi from 'joi';

export const partnerPreferenceSchema = Joi.object({
  minAge: Joi.number().integer().min(18).optional(),
  maxAge: Joi.number().integer().min(18).optional(),

  minHeightCm: Joi.number().integer().optional(),
  maxHeightCm: Joi.number().integer().optional(),

  religion: Joi.string().max(50).optional(),
  caste: Joi.string().max(50).optional(),
  education: Joi.string().max(100).optional(),

  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  motherTongue: Joi.string().max(50).optional(),

  kundliMatchRequired: Joi.boolean().optional(),

  manglikPreference: Joi.string()
    .valid('yes', 'no', 'both')
    .optional()
});
