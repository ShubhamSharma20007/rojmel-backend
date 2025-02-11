const profileService = require('../services/profileService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Dashboard Controller
exports.getFinancialyearListing = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes user ID is attached to the request by auth middleware
    const financialYearList = await profileService.fetchFinancialyearListing(userId);
    res.status(200).json(successResponse('Financial year fetched successfully.', financialYearList, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await profileService.getProfile(userId);
    res.status(200).json(successResponse('profile fetch successfully.', profile, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes user ID is attached to the request by auth middleware
    const profile = await profileService.updateProfile(userId, req.body);
    res.status(200).json(successResponse('profile updated successfully.', profile, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

exports.updateFinancialYear = async (req, res) => {
  try {
    const userId = req.user.id;
    const financialYearId = await profileService.updateFinancialYear(userId, req.body);
    res.status(200).json(successResponse('Financial year updated successfully.', financialYearId, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};
