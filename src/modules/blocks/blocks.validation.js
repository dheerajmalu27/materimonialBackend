import Joi from 'joi';

/**
 * Validation schema for blocking a user
 */
export const blockUserSchema = {
  body: Joi.object({
    blockedUserId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'blockedUserId must be a number',
        'number.integer': 'blockedUserId must be an integer',
        'number.positive': 'blockedUserId must be positive',
        'any.required': 'blockedUserId is required'
      })
  })
};

/**
 * Validation schema for unblocking a user
 */
export const unblockUserSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Block ID must be a number',
        'number.integer': 'Block ID must be an integer',
        'number.positive': 'Block ID must be positive',
        'any.required': 'Block ID is required'
      })
  })
};
