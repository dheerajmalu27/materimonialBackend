import Joi from 'joi';

export const upsertEducationSchema = Joi.object({
  qualification: Joi.string().max(100).required(),
  college: Joi.string().max(150).required(),
  university: Joi.string().max(150).optional().allow(null, ''),
  passingYear: Joi.number()
    .integer()
    .min(1950)
    .max(new Date().getFullYear())
    .optional(),
  highest: Joi.boolean().optional()
});
