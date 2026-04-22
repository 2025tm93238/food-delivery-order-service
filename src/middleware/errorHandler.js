const { AppError } = require("../utils/errors");
const { logger } = require("./logger");

module.exports = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      correlationId: req.correlationId,
    });
  }

  logger.error("unhandled_error", {
    correlationId: req.correlationId,
    err: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Internal server error",
    correlationId: req.correlationId,
  });
};
