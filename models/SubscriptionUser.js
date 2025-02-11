const mongoose = require('mongoose');

const subscriptionUserSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // Assuming there's a `User` model
  subscription_id: { type: String, required: true },
  payment_id: { type: String, required: true }, // Razorpay Payment ID
  status: { type: String, enum: ['pending', 'completed', 'failed'], required: true },
  amount: { type: Number, required: true },
}, { timestamps: true }); // Automatically includes `created_at` and `updated_at`

module.exports = mongoose.model('SubscriptionUser', subscriptionUserSchema);
