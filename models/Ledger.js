const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // Assuming 'Head' is another collection
  head_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Head', required: true }, // Assuming 'Head' is another collection
  details: { type: String, required: true },
  amount: { type: Number, required: true },
  transaction_date: { type: Date, required: true },
  transaction_type: { type: String, enum: ['IN', 'OUT'], required: true },
  payment_method: { type: String, enum: ['cash', 'online', 'cheque'], required: true },
  cheque_number: { type: String, default: null },
  cheque_pfms_clearing_date: { type: String, default: null },
  financial_year_id: {type:String,required: true}
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
