import Joi from 'joi';

/**
 * Validation schema for creating a conversation
 */
export const createConversationSchema = {
  body: Joi.object({
    userId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'userId must be a number',
        'number.integer': 'userId must be an integer',
        'number.positive': 'userId must be positive',
        'any.required': 'userId is required'
      })
  })
};

/**
 * Validation schema for getting a conversation by ID
 */
export const getConversationSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Conversation ID must be a number',
        'number.integer': 'Conversation ID must be an integer',
        'number.positive': 'Conversation ID must be positive',
        'any.required': 'Conversation ID is required'
      })
  })
};

/**
 * Validation schema for deleting a conversation
 */
export const deleteConversationSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Conversation ID must be a number',
        'number.integer': 'Conversation ID must be an integer',
        'number.positive': 'Conversation ID must be positive',
        'any.required': 'Conversation ID is required'
      })
  })
};

/**
 * Validation schema for sending a message
 */
export const sendMessageSchema = {
  body: Joi.object({
    conversationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'conversationId must be a number',
        'number.integer': 'conversationId must be an integer',
        'number.positive': 'conversationId must be positive',
        'any.required': 'conversationId is required'
      }),
    message: Joi.string().trim().min(1).max(1000).required()
      .messages({
        'string.base': 'message must be a string',
        'string.empty': 'message cannot be empty',
        'string.min': 'message must be at least 1 character long',
        'string.max': 'message cannot exceed 1000 characters',
        'any.required': 'message is required'
      })
  })
};

/**
 * Validation schema for getting messages in a conversation
 */
export const getMessagesSchema = {
  params: Joi.object({
    conversationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Conversation ID must be a number',
        'number.integer': 'Conversation ID must be an integer',
        'number.positive': 'Conversation ID must be positive',
        'any.required': 'Conversation ID is required'
      })
  }),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    before: Joi.string().optional()
      .messages({
        'string.base': 'Before must be a string'
      })
  })
};

/**
 * Validation schema for deleting a message
 */
export const deleteMessageSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Message ID must be a number',
        'number.integer': 'Message ID must be an integer',
        'number.positive': 'Message ID must be positive',
        'any.required': 'Message ID is required'
      })
  })
};

/**
 * Validation schema for marking messages as read
 */
export const markReadSchema = {
  body: Joi.object({
    conversationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'conversationId must be a number',
        'number.integer': 'conversationId must be an integer',
        'number.positive': 'conversationId must be positive',
        'any.required': 'conversationId is required'
      })
  })
};

/**
 * Validation schema for starting typing indicator
 */
export const typingStartSchema = {
  body: Joi.object({
    conversationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'conversationId must be a number',
        'number.integer': 'conversationId must be an integer',
        'number.positive': 'conversationId must be positive',
        'any.required': 'conversationId is required'
      })
  })
};

/**
 * Validation schema for stopping typing indicator
 */
export const typingStopSchema = {
  body: Joi.object({
    conversationId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'conversationId must be a number',
        'number.integer': 'conversationId must be an integer',
        'number.positive': 'conversationId must be positive',
        'any.required': 'conversationId is required'
      })
  })
};
