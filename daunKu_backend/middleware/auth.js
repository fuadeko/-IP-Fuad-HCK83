// backend/middleware/authentication.js
const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

async function authentication(req, res, next) {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      throw { name: "Unauthorized", message: "Token tidak ditemukan" };
    }
    const [type, token] = bearerToken.split(" ");
    if (type !== "Bearer") {
      throw { name: "Unauthorized", message: "Format token tidak valid" };
    }
    const data = verifyToken(token);

    const user = await User.findByPk(data.id);

    if (!user) {
      throw {
        name: "Unauthorized",
        message: "Token tidak valid, pengguna tidak ditemukan",
      };
    }
    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      error.name = "Unauthorized";
      error.message = "Token kadaluarsa";
    } else if (error.name === "JsonWebTokenError") {
      error.name = "Unauthorized";
      error.message = "Token tidak valid";
    }
    next(error);
  }
}

module.exports = authentication;
