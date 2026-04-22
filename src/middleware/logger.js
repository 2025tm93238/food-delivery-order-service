const SERVICE_NAME = process.env.SERVICE_NAME || "unknown-service";

const log = (level, msg, meta = {}) => {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      service: SERVICE_NAME,
      level,
      msg,
      ...meta,
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
    logger.info("request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      correlationId: req.correlationId,
    });
  });
  next();
};

module.exports = { logger, requestLogger };
