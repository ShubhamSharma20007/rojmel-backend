const User = require('../models/User');

// Fetch Dashboard Data Service
exports.fetchDashboardData = async (userId) => {
  // Find user by ID and exclude the password field
  const user = await User.findById(userId).select('-password');
  if (!user) throw { status: 404, message: 'User not found.' };

  return user;
};
