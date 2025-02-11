const Ledger = require("../models/Ledger.js");
const ledgerValidation = require("../validations/ledgerValidation");
const { getSubscriptionDetails } = require("../helpers/subscriptionHelper");
const ApprovalRequest = require("../models/ApprovalRequest.js");

// Create a new school head
exports.addLedger = async (data, user) => {
  const { error } = ledgerValidation.create.validate(data);
  if (error) throw { status: 400, message: error.details[0].message };

  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  data.user_id = user_id;
  data.financial_year_id = financial_year_id;

  return Ledger.create(data);
};

exports.viewLedger = async (id, user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);
  return Ledger.findById({_id: id, user_id, financial_year_id}).populate('head_id', 'head_name');
};

exports.getLedgers = async (user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);
  const ledgers = await Ledger.find({ user_id, financial_year_id }).sort({ transaction_date: 1 }).populate('head_id', 'head_name');
  return ledgers;
};

exports.updateLedger = async (id, data, user) => {
  const { error } = ledgerValidation.update.validate(data);
  if (error) throw { status: 400, message: error.details[0].message };

  const { user_id } = await getSubscriptionDetails(user);
  // Create an approval request
  const approvalRequest = new ApprovalRequest({
    user_id,
    ledger_id: id,
    action: 'update',
    data,
  });

  await approvalRequest.save();
  return;
};

exports.deleteLedger = async (id, user) => {
  const { user_id } = await getSubscriptionDetails(user);

  // Create an approval request
  const approvalRequest = new ApprovalRequest({
    user_id,
    ledger_id: id,
    action: 'delete',
  });

  await approvalRequest.save();
  return;
};