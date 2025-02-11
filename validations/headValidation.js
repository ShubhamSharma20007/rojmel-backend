const Joi = require('joi');

const headValidation = {
  create: Joi.object({
      head_name: Joi.string().max(100).required(),
      opening_balance_cash: Joi.number().precision(2).required(),
      opening_balance_bank: Joi.number().precision(2).required(),
    }),
    update: Joi.object({
      head_name: Joi.string().max(100).optional(),
      opening_balance_cash: Joi.number().precision(2).optional(),
      opening_balance_bank: Joi.number().precision(2).optional(),
      status: Joi.boolean().optional(),
    }),
};

module.exports = headValidation;