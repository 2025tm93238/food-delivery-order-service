const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const { sequelize } = require("../config/db");
const { errors } = require("../utils/errors");
const httpClient = require("../utils/httpClient");

const TAX_RATE = 0.05;
const DELIVERY_FEE = 30;

const VALID_TRANSITIONS = {
  CREATED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const round2 = (n) => Math.round(n * 100) / 100;

const getNextOrderId = async (tx) => {
  const row = await Order.findOne({
    order: [["order_id", "DESC"]],
    transaction: tx,
  });
  return (row?.order_id ?? 0) + 1;
};

const getNextItemId = async (tx) => {
  const row = await OrderItem.findOne({
    order: [["order_item_id", "DESC"]],
    transaction: tx,
  });
  return (row?.order_item_id ?? 0) + 1;
};

const assertOrder = async (order_id, tx) => {
  const order = await Order.findOne({ where: { order_id }, transaction: tx });
  if (!order) throw errors.notFound("ORDER_NOT_FOUND", `Order ${order_id} not found`);
  return order;
};

const create = async (body, correlationId) => {
  const customer = await httpClient.getCustomer(body.customer_id, correlationId);
  if (!customer) {
    throw errors.badRequest("CUSTOMER_NOT_FOUND", `Customer ${body.customer_id} not found`);
  }

  const address = await httpClient.getAddress(body.address_id, correlationId);
  if (!address) {
    throw errors.badRequest("ADDRESS_NOT_FOUND", `Address ${body.address_id} not found`);
  }
  if (address.customer_id !== body.customer_id) {
    throw errors.badRequest(
      "ADDRESS_NOT_OWNED",
      `Address ${body.address_id} does not belong to customer ${body.customer_id}`
    );
  }

  const restaurant = await httpClient.getRestaurant(body.restaurant_id, correlationId);
  if (!restaurant) {
    throw errors.badRequest("RESTAURANT_NOT_FOUND", `Restaurant ${body.restaurant_id} not found`);
  }
  if (restaurant.is_open === false) {
    throw errors.unprocessable(
      "RESTAURANT_CLOSED",
      `Restaurant '${restaurant.name}' is currently closed`
    );
  }

  const itemIds = body.items.map((i) => i.item_id);
  if (new Set(itemIds).size !== itemIds.length) {
    throw errors.badRequest("DUPLICATE_ITEM", "Items must not contain duplicate item_id");
  }

  let subtotal = 0;
  const priced = [];
  for (const i of body.items) {
    const menuItem = await httpClient.getMenuItem(i.item_id, correlationId);
    if (!menuItem) {
      throw errors.badRequest("MENU_ITEM_NOT_FOUND", `Menu item ${i.item_id} not found`);
    }
    if (menuItem.restaurant_id !== body.restaurant_id) {
      throw errors.badRequest(
        "ITEM_WRONG_RESTAURANT",
        `Item ${i.item_id} does not belong to restaurant ${body.restaurant_id}`
      );
    }
    if (!menuItem.is_available) {
      throw errors.unprocessable(
        "ITEM_UNAVAILABLE",
        `Item '${menuItem.name}' is unavailable`
      );
    }
    subtotal += menuItem.price * i.quantity;
    priced.push({
      item_id: i.item_id,
      quantity: i.quantity,
      price: menuItem.price,
    });
  }
  subtotal = round2(subtotal);
  const tax = round2(subtotal * TAX_RATE);
  const total = round2(subtotal + tax + DELIVERY_FEE);

  if (Math.abs(total - body.total_from_client) > 0.01) {
    throw errors.badRequest(
      "TOTAL_MISMATCH",
      `Computed total ${total} does not match client total ${body.total_from_client}`
    );
  }

  const { order, items } = await sequelize.transaction(async (tx) => {
    const order_id = await getNextOrderId(tx);
    const created = await Order.create(
      {
        order_id,
        customer_id: body.customer_id,
        restaurant_id: body.restaurant_id,
        address_id: body.address_id,
        order_status: "CREATED",
        order_total: total,
        payment_status: "PENDING",
        created_at: new Date(),
        restaurant_name: restaurant.name,
        address_city: address.city,
      },
      { transaction: tx }
    );

    let nextItemId = await getNextItemId(tx);
    const rows = [];
    for (const p of priced) {
      const oi = await OrderItem.create(
        {
          order_item_id: nextItemId++,
          order_id,
          item_id: p.item_id,
          quantity: p.quantity,
          price: p.price,
        },
        { transaction: tx }
      );
      rows.push(oi.toJSON());
    }
    return { order: created.toJSON(), items: rows };
  });

  httpClient.sendNotification(
    {
      userId: String(body.customer_id),
      type: "ORDER_PLACED",
      channel: "EMAIL",
      message: `Order #${order.order_id} placed at ${restaurant.name} — total ₹${total}`,
      metadata: {
        order_id: order.order_id,
        subtotal,
        tax,
        delivery_fee: DELIVERY_FEE,
        total,
      },
    },
    correlationId
  );

  return {
    ...order,
    items,
    pricing: { subtotal, tax, delivery_fee: DELIVERY_FEE, total },
  };
};

const list = async ({ page, limit, skip, filters }) => {
  const where = {};
  if (filters.customer_id) where.customer_id = parseInt(filters.customer_id);
  if (filters.restaurant_id) where.restaurant_id = parseInt(filters.restaurant_id);
  if (filters.status) where.order_status = filters.status;
  if (filters.payment_status) where.payment_status = filters.payment_status;

  const { rows, count } = await Order.findAndCountAll({
    where,
    order: [["order_id", "DESC"]],
    offset: skip,
    limit,
  });
  return {
    items: rows.map((r) => r.toJSON()),
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit),
  };
};

const getById = async (order_id) => {
  const order = await Order.findOne({ where: { order_id } });
  if (!order) throw errors.notFound("ORDER_NOT_FOUND", `Order ${order_id} not found`);
  const items = await OrderItem.findAll({
    where: { order_id },
    order: [["order_item_id", "ASC"]],
  });
  return { ...order.toJSON(), items: items.map((i) => i.toJSON()) };
};

const transition = async (order_id, nextStatus, correlationId) => {
  return sequelize.transaction(async (tx) => {
    const order = await assertOrder(order_id, tx);
    const allowed = VALID_TRANSITIONS[order.order_status] || [];
    if (!allowed.includes(nextStatus)) {
      throw errors.badRequest(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition from ${order.order_status} to ${nextStatus}`
      );
    }
    await order.update({ order_status: nextStatus }, { transaction: tx });

    if (nextStatus === "CONFIRMED" || nextStatus === "DELIVERED") {
      httpClient.sendNotification(
        {
          userId: String(order.customer_id),
          type: nextStatus === "CONFIRMED" ? "ORDER_CONFIRMED" : "ORDER_DELIVERED",
          channel: "EMAIL",
          message: `Order #${order_id} ${nextStatus.toLowerCase()}`,
          metadata: { order_id, status: nextStatus },
        },
        correlationId
      );
    }
    return order.toJSON();
  });
};

const confirm = (order_id, cid) => transition(order_id, "CONFIRMED", cid);
const cancel = (order_id, cid) => transition(order_id, "CANCELLED", cid);
const updateStatus = (order_id, status, cid) => transition(order_id, status, cid);

const updatePaymentStatus = async (order_id, payment_status) => {
  const order = await assertOrder(order_id);
  await order.update({ payment_status });
  return order.toJSON();
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
