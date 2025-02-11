const SubscriptionUser = require('../models/SubscriptionUser');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const FinancialYear = require('../models/FinancialYear');
const { updateSchema, updateFinancialYearSchema } = require('../validations/authValidation');

exports.fetchFinancialyearListing = async (userId) => {
  // Find user by ID and exclude the password field
  const subscriptionUsers = await SubscriptionUser.find({ user_id: userId })
  const subscriptionIds = subscriptionUsers.map((subUser) => subUser.subscription_id);
  const subscriptions = await Subscription.find({ _id: { $in: subscriptionIds } }).lean();
  for(let i = 0; i < subscriptions.length; i++) {
    subscriptions[i].financialData = await FinancialYear.findById(subscriptions[i].financial_year_id).lean();
  }
  return subscriptions
};

exports.getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  const subscriptionUser = await SubscriptionUser.findOne({ user_id: userId }).lean();
  if (subscriptionUser) {
    const subscription = await Subscription.findById(subscriptionUser.subscription_id).select('financial_year_id').lean();
    if (subscription) {
      user.subscription = subscription;
    }
  }
  return user;
};

exports.updateProfile = async (userId, updatedata) => {
   const { error } = updateSchema.validate(updatedata);
   if (error) throw { status: 400, message: error.details[0].message };
   return await User.findByIdAndUpdate(userId, updatedata).select('-password');
};

exports.updateFinancialYear = async (userId, updatedata) => {
  const { error } = updateFinancialYearSchema.validate(updatedata);
  if (error) throw { status: 400, message: error.details[0].message };
  const updatedUser = await User.findByIdAndUpdate(userId, updatedata, { new: true }).select('current_subscription_id');
  return updatedUser;
};
