const dashboardService = require('../services/dashboardService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Dashboard Controller
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes user ID is attached to the request by auth middleware
    const dashboardData = await dashboardService.fetchDashboardData(userId);
    res.status(200).json(successResponse('Dashboard fetched successfully.', dashboardData, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};
