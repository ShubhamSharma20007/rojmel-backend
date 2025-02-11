const mongoose = require('mongoose');

const financialYearSchema = new mongoose.Schema({
  fy_start_date: { type: Date, required: true },
  fy_end_date: { type: Date, required: true },
  financial_tag: { type: String, required: true }, // E.g., 'FY 2023-24'
}, { timestamps: true }); // Automatically includes `created_at` and `updated_at`

module.exports = mongoose.model('FinancialYear', financialYearSchema);
