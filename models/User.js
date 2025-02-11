const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  brc_full_name: { type: String, required: true },
  school_name: { type: String, required: true },
  school_dice_code: { type: String, required: true },
  rojmel_name: { type: String, required: true },
  cluster_name: { type: String, required: true },
  block_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  bank_branch_name: { type: String, required: true },
  bank_account_no: { type: String, required: true },
  address: { type: String, required: true },
  sub_division: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String, required: true },
  mobile_no: { type: String, required: true},
  business_email: { type: String, required: true},
  password: { type: String, required: true },
  current_subscription_id: { type: String, default: null},
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
