const axios = require("axios");
const { logger } = require("../middleware/logger");
const { errors } = require("./errors");

const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || "http://localhost:3001";
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || "http://localhost:3002";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006";

const fetch = async (baseUrl, path, correlationId) => {
  try {
    const res = await axios.get(`${baseUrl}${path}`, {
      headers: { "X-Correlation-Id": correlationId },
      timeout: 5000,
    });
    return res.data?.data ?? null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    logger.warn("downstream_call_failed", {
      correlationId,
      url: `${baseUrl}${path}`,
      status: err.response?.status,
      error: err.response?.data || err.message,
    });
    throw errors.internal(
      "DOWNSTREAM_UNAVAILABLE",
      `Downstream call failed: ${baseUrl}${path}`
    );
  }
};

const getCustomer = (id, cid) => fetch(CUSTOMER_SERVICE_URL, `/v1/customers/${id}`, cid);
const getAddress = (id, cid) => fetch(CUSTOMER_SERVICE_URL, `/v1/addresses/${id}`, cid);
const getRestaurant = (id, cid) => fetch(RESTAURANT_SERVICE_URL, `/v1/restaurants/${id}`, cid);
const getMenuItem = (id, cid) => fetch(RESTAURANT_SERVICE_URL, `/v1/menu/${id}`, cid);

const sendNotification = async (payload, correlationId) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/v1/notifications`, payload, {
      headers: { "X-Correlation-Id": correlationId },
      timeout: 5000,
    });
  } catch (err) {
    logger.warn("notification_failed", {
      correlationId,
      error: err.response?.data || err.message,
    });
  }
};

module.exports = {
  getCustomer,
  getAddress,
  getRestaurant,
  getMenuItem,
  sendNotification,
};
