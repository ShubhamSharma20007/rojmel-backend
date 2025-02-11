const Head = require("../models/Head");
const headValidation = require("../validations/headValidation");
const { convertDecimal128 } = require("../utils/convertDecimal");
const { getSubscriptionDetails } = require("../helpers/subscriptionHelper");

// Create new account heads
exports.createHeads = async (data, user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  // Filter out heads with blank names
  const validHeads = data.filter(head => head.head_name && head.head_name.trim() !== '');

  if (validHeads.length === 0) throw { status: 400, message: "Head name is required" };
  // Validate each head
  for (const head of validHeads) {
    const { error } = headValidation.create.validate(head);
    if (error) throw { status: 400, message: error.details[0].message };

    // Add the user ID and financial year ID to each head
    head.user_id = user_id;
    head.financial_year_id = financial_year_id;

    // Check if the head already exists for the user and financial year
    const existingHead = await Head.findOne({ user_id, head_name: head.head_name, financial_year_id });
    if (existingHead) throw { status: 400, message: `Head ${head.head_name} already exists for this financial year` };
  }

  // Create and save the new heads
  const heads = await Head.insertMany(validHeads);

  const formattedHeads = heads.map(head => convertDecimal128(head.toObject()));
  return formattedHeads;
};

// Get all account heads
exports.getHeads = async (user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  // Get all heads of the user for the current financial year, sorted by updatedAt in descending order
  const heads = await Head.find({ user_id, financial_year_id }).sort({ updatedAt: -1 });

  // Format the response
  const formattedHeads = heads.map(head => convertDecimal128(head.toObject()));
  return formattedHeads;
};

// Get an account head by ID
exports.getHeadById = async (id, user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  // Get the head by ID
  const head = await Head.findOne({ _id: id, user_id, financial_year_id });
  if (!head) throw { status: 404, message: "Head not found" };

  // Format the response
  const formattedHead = convertDecimal128(head.toObject());
  return formattedHead;
};

// Update an account head by ID
exports.updateHead = async (id, data, user) => {
  const { error } = headValidation.update.validate(data);
  if (error) throw { status: 400, message: error.details[0].message };

  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  // Update the head by ID
  const head = await Head.findOneAndUpdate({ _id: id, user_id, financial_year_id }, data, { new: true });
  if (!head) throw { status: 404, message: "Head not found" };

  // Format the response
  const formattedHead = convertDecimal128(head.toObject());
  return formattedHead;
};

// Delete an account head by ID
exports.deleteHead = async (id, user) => {
  const { user_id, financial_year_id } = await getSubscriptionDetails(user);

  // Delete the head by ID
  const head = await Head.findOneAndDelete({ _id: id, user_id, financial_year_id });
  if (!head) throw { status: 404, message: "Head not found" };

  return;
};
