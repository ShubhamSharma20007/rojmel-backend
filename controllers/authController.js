const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
// Register Controller
exports.register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(successResponse('User registered successfully.', result, 201));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(successResponse('User login successfully.', result, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.sendOtpToEmail(email);
    res.status(200).json(successResponse('OTP sent successfully.', result, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    const result = await authService.resetPassword(email, otp, new_password);
    res.status(200).json(successResponse('Password reset successfully.', null, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};
