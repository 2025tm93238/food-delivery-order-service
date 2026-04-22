const { errors } = require("../utils/errors");

module.exports = (schema, property = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return next(
      errors.badRequest(
        "VALIDATION_ERROR",
        error.details.map((d) => d.message).join("; ")
      )
    );
  }
  req[property] = value;
  next();
};
