const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ledger_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ledger', required: true },
  action: { type: String, enum: ['update', 'delete'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: function() { return this.action === 'update'; } },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);