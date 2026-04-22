const orderService = require("../services/order.service");
const { success } = require("../utils/response");
const { parsePagination } = require("../utils/pagination");

const create = async (req, res) => {
  const order = await orderService.create(req.body, req.correlationId);
  success(req, res, order, 201);
};

const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { customer_id, restaurant_id, status, payment_status } = req.query;
  const result = await orderService.list({
    page,
    limit,
    skip,
    filters: { customer_id, restaurant_id, status, payment_status },
  });
  success(req, res, result);
};

const getById = async (req, res) => {
  const order = await orderService.getById(parseInt(req.params.id));
  success(req, res, order);
};

const confirm = async (req, res) => {
  const order = await orderService.confirm(parseInt(req.params.id), req.correlationId);
  success(req, res, order);
};

const cancel = async (req, res) => {
  const order = await orderService.cancel(parseInt(req.params.id), req.correlationId);
  success(req, res, order);
};

const updateStatus = async (req, res) => {
  const order = await orderService.updateStatus(
    parseInt(req.params.id),
    req.body.status,
    req.correlationId
  );
  success(req, res, order);
};

const updatePaymentStatus = async (req, res) => {
  const order = await orderService.updatePaymentStatus(
    parseInt(req.params.id),
    req.body.payment_status
  );
  success(req, res, order);
};

module.exports = {
  create,
  list,
  getById,
  confirm,
  cancel,
  updateStatus,
  updatePaymentStatus,
};
