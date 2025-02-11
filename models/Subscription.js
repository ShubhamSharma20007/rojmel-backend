const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  plan_name: { type: String, required: true },
  financial_year_id: { type: String, required: true }, // Foreign key
  plan_id: { type: String, required: true }, // Razorpay Plan ID
}, { timestamps: true }); // Automatically includes `created_at` and `updated_at`

module.exports = mongoose.model('Subscription', subscriptionSchema);
