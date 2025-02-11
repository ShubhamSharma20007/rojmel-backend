const Joi = require('joi');

const ledgerValidation = {
  create: Joi.object({
    head_id: Joi.string().required(), // Assuming `head_id` is a MongoDB ObjectId in string format
    details: Joi.string().max(255).required(),
    amount: Joi.number().positive().required(),
    transaction_date: Joi.date().required(),
    transaction_type: Joi.string().valid('IN', 'OUT').required(),
    payment_method: Joi.string().valid('cash', 'online', 'cheque').required(),
    cheque_number: Joi.optional(),
    cheque_pfms_clearing_date: Joi.optional(),
  }),
  update: Joi.object({
    head_id: Joi.string().optional(),
    details: Joi.string().max(255).optional(),
    amount: Joi.number().positive().optional(),
    transaction_date: Joi.date().optional(),
    transaction_type: Joi.string().valid('IN', 'OUT').optional(),
    payment_method: Joi.string().valid('cash', 'online', 'cheque').optional(),
    cheque_number: Joi.optional(),
    cheque_pfms_clearing_date: Joi.optional(),
  }),
};

module.exports = ledgerValidation;
