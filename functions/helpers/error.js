class ErrorHandler extends Error {
  constructor(statusCode, code, message) {
    super();
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
  }
}

const handleError = (err, res) => {
  var { statusCode, code, message } = err;
  statusCode = statusCode || 500;
  res.status(statusCode).json({
    status: "error",
    statusCode,
    code,
    message,
  });
};

module.exports = {
  ErrorHandler,
  handleError,
};
