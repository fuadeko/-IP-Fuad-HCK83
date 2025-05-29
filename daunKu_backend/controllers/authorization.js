const { User } = require("../models/index");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { OAuth2Client } = require("google-auth-library");
// const bcrypt = require("bcryptjs");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthController {
  static async register(req, res, next) {
    try {
      const { userName, email, password } = req.body;
      console.log("Register attempt:", { userName, email, password: "***" });

      if (!userName || !email || !password) {
        throw {
          name: "BadRequest",
          message: "Username, email, and password are required",
        };
      }

      console.log("Creating user...");
      const newUser = await User.create({ userName, email, password });
      console.log("User created successfully:", newUser.id);

      res.status(201).json({
        id: newUser.id,
        userName: newUser.userName,
        email: newUser.email,
      });
    } catch (error) {
      console.error("Register error:", error);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw {
          name: "BadRequest",
          message: "Email and password are required",
        };
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw { name: "Unauthorized", message: "Invalid email or password" };
      }

      const isPasswordValid = comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw { name: "Unauthorized", message: "Invalid email or password" };
      }

      const payload = {
        id: user.id,
        email: user.email,
        userName: user.userName,
      };
      const access_token = signToken(payload);

      res.status(200).json({
        access_token,
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Login with Google
  static async loginWithGoogle(req, res, next) {
    try {
      console.log("📥 Google login request received", req.body);
      const { id_token } = req.body;
  
      if (!id_token) {
        console.log("❌ No id_token provided");
        return res.status(400).json({
          message: "Google token is required",
        });
      }
  
      console.log("🔑 Verifying Google token...");
      console.log("🔑 Using GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
      
      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
      const { email, name, picture } = payload;
  
      console.log("🔍 Google login attempt for:", email);
      console.log("👤 User data from Google:", { email, name, picture });
  
      // Cek apakah user sudah ada
      let user = await User.findOne({ where: { email } });
  
      if (!user) {
        console.log("🆕 Creating new Google user:", email);
        // Jika user belum ada, buat user baru dengan password yang konsisten
        const randomPassword =
          Math.random().toString(36) + Date.now().toString(36);
        const hashedPassword = hashPassword(randomPassword);
  
        // Verify hash before saving
        const hashTest = comparePassword(randomPassword, hashedPassword);
        if (!hashTest) {
          throw new Error("Google user hash generation failed");
        }
  
        user = await User.create({
          userName: name,
          email: email,
          password: hashedPassword,
          profilePicture: picture,
        });
  
        console.log("✅ Google user created successfully:", email);
      } else {
        console.log("✅ Existing Google user found:", email);
      }
  
      // Generate token - FIX: gunakan variabel token yang sudah didefinisikan
      const access_token = signToken({
        id: user.id,
        email: user.email,
        userName: user.userName, // Tambahkan userName
      });
  
      console.log("✅ Google login successful for:", email);
  
      res.status(200).json({
        access_token, // Sekarang variabel sudah didefinisikan
        user: {
          id: user.id,
          userName: user.userName,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("❌ Google login error:", error.message);
      console.error("❌ Full error:", error);
      
      // Send more specific error message
      res.status(500).json({
        message: "Google authentication failed",
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
