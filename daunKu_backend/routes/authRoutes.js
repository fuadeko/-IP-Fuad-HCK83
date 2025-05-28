const express = require("express");
const AuthController = require("../controllers/authorization");

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register user baru dengan email dan password
 * @access Public
 */
router.post("/register", AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user dengan email dan password
 * @access Public
 */
router.post("/login", AuthController.login);

/**
 * @route POST /api/auth/google
 * @desc Proses Google Sign-In dan buat/dapatkan user
 * @access Public
 */
router.post("/google", AuthController.googleLogin);

module.exports = router;
