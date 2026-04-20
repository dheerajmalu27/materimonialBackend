import Joi from 'joi';

export const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    password: Joi.string().min(8).required(),
    gender: Joi.string().required(),

    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    dob: Joi.date().iso().optional(),
    birthTime: Joi.string().optional(),
    heightCm: Joi.number().integer().min(30).max(250).optional(),
    weightKg: Joi.number().integer().min(20).max(250).optional(),
    
    // Full profile data support
    profileData: Joi.object({
      personal: Joi.object({
        firstName: Joi.string().max(100).required(),
        lastName: Joi.string().max(100).required(),
        fullName: Joi.string().max(100).required(),
        age: Joi.number().integer().min(18).max(100).optional(),
        dateOfBirth: Joi.date().iso().optional(),
        birthTime: Joi.string().optional(),
        location: Joi.string().max(100).optional(),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
        education:Joi.string().max(100).optional(),
        aboutMe: Joi.string().max(500).optional(),
        heightCm: Joi.number().integer().min(30).max(250).optional(),
        weightKg: Joi.number().integer().optional(),
        occupation: Joi.string().optional(),
        maritalStatus: Joi.string().optional(),
      }).optional(),
      
      religion: Joi.object({
        religion: Joi.string().required(),
        caste: Joi.string().optional(),
        manglik: Joi.string().optional(),
      }).optional(),
      
      professional: Joi.object({
        occupation: Joi.string().optional(),
        workLocation: Joi.string().optional(),
        employer: Joi.string().optional(),
        annualIncome: Joi.string().optional(),
      }).optional(),
      
      education: Joi.array().items(Joi.object({
        degree: Joi.string().optional(),
        college: Joi.string().allow('').optional(),
        university: Joi.string().allow('').optional(),
        yearOfPassing: Joi.number().optional(),
        highest: Joi.boolean().optional(),
      })).optional(),
      
      family: Joi.object({
        fatherName: Joi.string().optional(),
        fatherOccupation: Joi.string().optional(),
        fatherMobile: Joi.string().optional(),
        motherName: Joi.string().optional(),
        motherOccupation: Joi.string().optional(),
        motherMobile: Joi.string().optional(),
        siblings: Joi.string().optional(),
        familyType: Joi.string().optional(),
        familyValues: Joi.string().optional(),
        familyStatus: Joi.string().allow('').optional(),
      }).optional(),
      
      lifestyle: Joi.object({
        diet: Joi.string().optional(),
        smoking: Joi.alternatives().try(Joi.boolean()).optional(),
        drinking: Joi.alternatives().try(Joi.boolean()).optional(),
        hobbies: Joi.array().items(Joi.string()).optional(),
        interests: Joi.array().items(Joi.string()).optional(),
      }).optional(),
      
      kundli: Joi.object({
        birthPlace: Joi.string().optional(),
        birthTime: Joi.string().optional(),
        manglik: Joi.string().optional(),
        rashi: Joi.string().optional(),
        nakshatra: Joi.string().optional(),
        gotra: Joi.string().allow('').optional(),
        charan: Joi.number().allow('').optional(),
        gan: Joi.string().allow('').optional(),
        nadi: Joi.string().allow('').optional(),
      }).optional(),
      
      partnerPreferences: Joi.object().optional(),
    }).optional(),
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