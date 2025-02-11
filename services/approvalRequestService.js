const ApprovalRequest = require("../models/ApprovalRequest");
const Ledger = require("../models/Ledger");

exports.getApprovalRequests = async () => {
  const requests = await ApprovalRequest.find({ status: 'pending' }).populate('ledger_id');
  return requests;
};

exports.approveRequest = async (id) => {
  const request = await ApprovalRequest.findById(id);
  if (!request) throw { status: 404, message: 'Request not found' };

  if (request.action === 'update') {
    await Ledger.findByIdAndUpdate(request.ledger_id, request.data);
  } else if (request.action === 'delete') {
    await Ledger.findByIdAndDelete(request.ledger_id);
  }

  request.status = 'approved';
  await request.save();

  return;
};

exports.rejectRequest = async (id) => {
  const request = await ApprovalRequest.findById(id);
  if (!request) throw { status: 404, message: 'Request not found' };

  request.status = 'rejected';
  await request.save();

  return;
};