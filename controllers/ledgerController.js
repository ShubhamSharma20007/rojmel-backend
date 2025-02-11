const ledgerService = require("../services/ledgerService");
const { successResponse, errorResponse } = require("../utils/responseHandler");

// Create a new school head
exports.addLedger = async (req, res) => {
  try {
    const response = await ledgerService.addLedger(req.body, req.user);
    res
      .status(200)
      .json(successResponse("Ledger added successfully.", response, 201));
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.viewLedger = async (req, res) => {
  try {
    const response = await ledgerService.viewLedger(req.params.id, req.user);
    res
      .status(200)
      .json(
        successResponse("Ledger data fetched successfully.", response, 200)
      );
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.getLedgers = async (req, res) => {
  try {
    const response = await ledgerService.getLedgers(req.user);
    res
      .status(200)
      .json(
        successResponse("Ledger data fetched successfully.", response, 200)
      );
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.updateLedger = async (req, res) => {
  try {
    const response = await ledgerService.updateLedger(
      req.params.id,
      req.body,
      req.user
    );
    res
      .status(200)
      .json(successResponse("Approval request sent to admin.", response, 200));
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.deleteLedger = async (req, res) => {
  try {
    const response = await ledgerService.deleteLedger(req.params.id, req.user);
    res
      .status(200)
      .json(successResponse("Approval request sent to admin.", response, 200));
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};
