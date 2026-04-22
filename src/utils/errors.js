class AppError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const errors = {
  badRequest: (code, msg) => new AppError(code, msg, 400),
  notFound: (code, msg) => new AppError(code, msg, 404),
  conflict: (code, msg) => new AppError(code, msg, 409),
  unprocessable: (code, msg) => new AppError(code, msg, 422),
  internal: (code, msg) => new AppError(code, msg, 500),
};

module.exports = { AppError, errors };
