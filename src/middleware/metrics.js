const client = require("prom-client");

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

const register = new client.Registry();
register.setDefaultLabels({ service: SERVICE_NAME });
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests received",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const ordersPlacedTotal = new client.Counter({
  name: "orders_placed_total",
  help: "Total number of orders successfully placed",
  registers: [register],
});

const paymentsFailedTotal = new client.Counter({
  name: "payments_failed_total",
  help: "Total number of failed or refunded payments",
  labelNames: ["method", "reason"],
  registers: [register],
});

const deliveryAssignmentLatencyMs = new client.Histogram({
  name: "delivery_assignment_latency_ms",
  help: "Latency of driver assignment in milliseconds",
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [register],
});

const routeOf = (req) => {
  if (req.route && req.baseUrl) return req.baseUrl + req.route.path;
  if (req.route) return req.route.path;
  return req.originalUrl.split("?")[0];
};

const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics" || req.path === "/health") return next();
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: routeOf(req),
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSec);
  });
  next();
};

const metricsHandler = async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  ordersPlacedTotal,
  paymentsFailedTotal,
  deliveryAssignmentLatencyMs,
};
