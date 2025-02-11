const ApprovalRequest = require("../models/ApprovalRequest");
const Ledger = require("../models/Ledger");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const approvalRequestService = require("../services/approvalRequestService");

exports.getApprovalRequests = async (req, res) => {
  try {
    const response = await approvalRequestService.getApprovalRequests();
    res.status(200).json(successResponse("Pending approval request fetched successfully.", response, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await approvalRequestService.approveRequest(id);
    res.status(200).json(successResponse("Request approved successfully", null, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await approvalRequestService.rejectRequest(id);
    res.status(200).json(successResponse("Approval request rejected", null, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};