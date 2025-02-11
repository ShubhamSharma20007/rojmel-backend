const Joi = require('joi');

// Register Validation Schema
const registerSchema = Joi.object({
  brc_full_name: Joi.string().max(100).required(),
  school_name: Joi.string().max(100).required(),
  pincode: Joi.string().length(6).required(), // Assuming pincode is 6 digits
  school_dice_code: Joi.string().max(50).required(),
  rojmel_name: Joi.string().max(100).required(),
  cluster_name: Joi.string().max(100).required(),
  block_name: Joi.string().max(100).required(),
  bank_name: Joi.string().max(100).required(),
  bank_branch_name: Joi.string().max(100).required(),
  bank_account_no: Joi.string().pattern(/^[0-9]+$/).required().messages({
    'string.pattern.base': 'Bank account number must contain only digits.',
    'string.empty': 'Bank account number is required.'
  }), // Assuming bank account number is numeric
  address: Joi.string().max(500).required(),
  sub_division: Joi.string().max(100).required(),
  district: Joi.string().max(100).required(),
  mobile_no: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Mobile number must be a 10 digit number',
      'any.required': 'Mobile number is required'
  }),
  business_email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Login Validation Schema
const loginSchema = Joi.object({
  bank_account_no: Joi.string().pattern(/^[0-9]+$/).required().messages({
    'string.pattern.base': 'Bank account number must contain only digits.',
    'string.empty': 'Bank account number is required.'
  }), // Assuming bank account number is numeric
  password: Joi.string().min(6).required(),
});


// Validation for Forgot Password
const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Invalid email format.',
  }),
});

// Validation for Reset Password
const resetPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Invalid email format.',
  }),
  otp: Joi.string().length(6).required().messages({
    'string.empty': 'OTP is required.',
    'string.length': 'OTP must be exactly 6 digits.',
  }),
  new_password: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required.',
    'string.min': 'Password must be at least 6 characters long.',
  }),
});

const updateSchema = Joi.object({
  brc_full_name: Joi.string().max(100).required(),
  school_name: Joi.string().max(100).required(),
  pincode: Joi.string().length(6).required(), // Assuming pincode is 6 digits
  school_dice_code: Joi.string().max(50).required(),
  rojmel_name: Joi.string().max(100).required(),
  cluster_name: Joi.string().max(100).required(),
  block_name: Joi.string().max(100).required(),
  bank_name: Joi.string().max(100).required(),
  bank_branch_name: Joi.string().max(100).required(),
  bank_account_no: Joi.string().pattern(/^[0-9]+$/).required().messages({
    'string.pattern.base': 'Bank account number must contain only digits.',
    'string.empty': 'Bank account number is required.'
  }), // Assuming bank account number is numeric
  address: Joi.string().max(500).required(),
  sub_division: Joi.string().max(100).required(),
  district: Joi.string().max(100).required(),
  mobile_no: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Mobile number must be a 10 digit number',
      'any.required': 'Mobile number is required'
  }),
  business_email: Joi.string().email().required()
});

const updateFinancialYearSchema = Joi.object({
  current_subscription_id: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateSchema,
  updateFinancialYearSchema
};
