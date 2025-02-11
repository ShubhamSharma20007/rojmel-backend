const subscriptionService = require("../services/subscriptionService");
const { successResponse, errorResponse } = require("../utils/responseHandler");

exports.getSubscriptionList = async (req, res) => {
  try {
    const subscriptionData = await subscriptionService.getSubscription(req.user.id);
    res
      .status(200)
      .json(
        successResponse(
          "Subscription fetched successfully.",
          subscriptionData,
          200
        )
      );
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.createOrder = async (req, res) => {
  try {
    const createOrder = await subscriptionService.createOrder(req.user, req.body);
    res
      .status(200)
      .json(successResponse("Order created successfully.", createOrder, 200));
  } catch (error) {
    res
      .status(error.status || 500)
      .json(errorResponse(error.message, error.status || 500));
  }
};

exports.webhook = async (req, res) => {
    try {
      await subscriptionService.webhook(req.body);
      res
        .status(200)
        .json(successResponse("Data processed successfully.", null, 200));
    } catch (error) {
      res
        .status(error.status || 500)
        .json(errorResponse(error.message, error.status || 500));
    }
  };
