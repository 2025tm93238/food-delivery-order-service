const Joi = require("joi");

const create = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  restaurant_id: Joi.number().integer().positive().required(),
  address_id: Joi.number().integer().positive().required(),
  items: Joi.array()
    .items(
      Joi.object({
        item_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).max(5).required(),
      })
    )
    .min(1)
    .max(20)
    .required(),
  total_from_client: Joi.number().positive().precision(2).required(),
});

const updateStatus = Joi.object({
  status: Joi.string()
    .valid("PREPARING", "READY", "DISPATCHED", "DELIVERED")
    .required(),
});

const updatePaymentStatus = Joi.object({
  payment_status: Joi.string().valid("PENDING", "SUCCESS", "FAILED").required(),
});

module.exports = { create, updateStatus, updatePaymentStatus };
