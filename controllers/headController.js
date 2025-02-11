const headService = require("../services/headService");
const { successResponse, errorResponse } = require("../utils/responseHandler");

// Create a new school head
exports.createHead = async (req, res) => {
  try {
    const response = await headService.createHeads(req.body, req.user);
    res.status(200).json(successResponse("Head created successfully.", response, 201));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Get all school heads
exports.getHeads = async (req, res) => {
  try {
    const response = await headService.getHeads(req.user);
    res.status(200).json(successResponse("Heads fetched successfully.", response, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Get a school head by ID
exports.getHeadById = async (req, res) => {
  try {
    const response = await headService.getHeadById(req.params.id, req.user);
    res.status(200).json(successResponse("Head fetched successfully.", response, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Update a school head by ID
exports.updateHead = async (req, res) => {
  try {
    const response = await headService.updateHead(req.params.id, req.body, req.user);
    res.status(200).json(successResponse("Head updated successfully.", response, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};

// Delete a school head by ID
exports.deleteHead = async (req, res) => {
  try {
    const response = await headService.deleteHead(req.params.id, req.user);
    res.status(200).json(successResponse("Head deleted successfully.", response, 200));
  } catch (error) {
    res.status(error.status || 500).json(errorResponse(error.message, error.status || 500));
  }
};
