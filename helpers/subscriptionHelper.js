const Subscription = require("../models/Subscription.js");

const getSubscriptionDetails = async (user) => {
  const user_id = user.id;
  const subscriptionDetails = await Subscription.findById(user?.current_subscription_id);
  if (!subscriptionDetails) throw { status: 400, message: 'Invalid operation please contact to admin' };
  const financial_year_id = subscriptionDetails.financial_year_id;
  return { user_id, financial_year_id };
};

module.exports = { getSubscriptionDetails };