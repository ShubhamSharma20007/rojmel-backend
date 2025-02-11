const mongoose = require('mongoose');

const headSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user (assuming a user model exists)
  head_name: { type: String, required: true, maxlength: 100 }, // Example: 'Cash', 'Bank', etc.
  financial_year_id: {type: mongoose.Schema.Types.ObjectId, required: true},
  opening_balance_cash: { type: mongoose.Decimal128, required: true }, // Opening Balance for either cash
  opening_balance_bank: { type: mongoose.Decimal128, required: true }, // Opening Balance for either bank
  status: { type: Boolean, default: true }, // true for active, false for inactive
}, { timestamps: true });

module.exports = mongoose.model('Head', headSchema);
