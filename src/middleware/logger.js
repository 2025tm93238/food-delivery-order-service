const { trace } = require("@opentelemetry/api");
const { maskObject } = require("../utils/mask");

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

const getTraceId = () => {
  try {
    const span = trace.getActiveSpan();
    return span?.spanContext()?.traceId;
  } catch {
    return undefined;
  }
};

const log = (level, msg, meta = {}) => {
  const traceId = getTraceId();
  const safeMeta = maskObject(meta);
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      service: SERVICE_NAME,
      level,
      msg,
      ...(traceId ? { traceId } : {}),
      ...safeMeta,
    })
  );
};

const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      correlationId: req.correlationId,
    };
    if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
      meta.body = req.body;
    }
    logger.info("request", meta);
  });
  next();
};

module.exports = { logger, requestLogger };
