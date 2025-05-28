// backend/middleware/errorHandler.js
const errorHandler = (error, _req, res, _next) => {
  console.log(error, "LLL");
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = {};
  if (error.name === "errorLogin") {
    statusCode = 400;
    message = error.message;
  } else if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError"
  ) {
    statusCode = 400;
    message = "Kesalahan validasi data";
    error.errors.forEach((element) => {
      if (!errors[element.path]) {
        errors[element.path] = [];
      }
      errors[element.path].push(element.message);
    });
    return res.status(statusCode).json({ message, errors });
  } else if (error.name === "Unauthorized") {
    statusCode = 401;
    message = error.message;
  } else if (error.name === "NotFound") {
    statusCode = 404;
    message = error.message;
  } else if (error.name === "Forbidden") {
    statusCode = 403;
    message = error.message;
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token tidak valid";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token kadaluarsa";
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
