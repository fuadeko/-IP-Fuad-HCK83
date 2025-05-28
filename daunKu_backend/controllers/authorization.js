const { signToken } = require("../helpers/jwt");
const db = require("../models");

class AuthController {
  static async register(req, res, next) {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return next({
        name: "ValidationError",
        message: "Display name, email, dan password wajib diisi.",
      });
    }

    if (password.length < 6) {
      return next({
        name: "ValidationError",
        message: "Password minimal 6 karakter.",
      });
    }

    try {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return next({
          name: "ValidationError",
          message: "Email sudah terdaftar.",
        });
      }

      const user = await db.User.create({
        userName,
        email,
        password,
        googleId: null,
      });

      const token = signToken({ id: user.id });

      res.status(201).json({
        message: "Registrasi berhasil!",
        token,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
          photo: user.photo,
        },
      });
    } catch (error) {
      console.error("Error saat registrasi:", error);
      next(error);
    }
  }

  static async login(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
      return next({
        name: "ValidationError",
        message: "Email dan password wajib diisi.",
      });
    }

    try {
      const user = await db.User.findOne({ where: { email } });
      if (!user) {
        return next({
          name: "Unauthorized",
          message: "Email atau password salah.",
        });
      }
      const isPasswordValid = user.checkPassword(password);
      if (!isPasswordValid) {
        return next({
          name: "Unauthorized",
          message: "Email atau password salah.",
        });
      }
      const token = signToken({ id: user.id });

      res.status(200).json({
        message: "Login berhasil!",
        token,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
          photo: user.photo,
        },
      });
    } catch (error) {
      console.error("Error saat login:", error);
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log(
      "GOOGLE_CLIENT_ID:",
      process.env.GOOGLE_CLIENT_ID ? "EXISTS" : "MISSING"
    );
    const { idToken } = req.body;

    if (!idToken) {
      return next({
        name: "Unauthorized",
        message: "ID Token tidak ditemukan.",
      });
    }

    try {
      let sub, email, name, picture;

      if (process.env.NODE_ENV === "production") {
        const { OAuth2Client } = require("google-auth-library");
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        ({ sub, email, name, picture } = payload);
      } else {
        ({ sub, email, name, picture } = {
          sub: "google_" + Date.now(),
          email: "test@gmail.com",
          name: "Test User",
          picture: "https://via.placeholder.com/150",
        });
      }

      let user = await db.User.findOne({ where: { googleId: sub } });

      if (!user) {
        user = await db.User.create({
          googleId: sub,
          userName: name,
          email: email,
          password: "google_auth_" + sub,
          photo: picture,
        });
      }

      const token = signToken({ id: user.id });

      res.status(200).json({
        message: "Login berhasil!",
        token,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
          photo: user.photo,
        },
      });
    } catch (error) {
      console.error("Verifikasi Google ID Token gagal:", error);
      next({ name: "Unauthorized", message: "Autentikasi Google gagal." });
    }
  }
}

module.exports = AuthController;
