const express = require("express");
const AIController = require("../controllers/aiController");

const router = express.Router();

// ===== AI ASSISTANCE =====
/**
 * @route POST /ai/diagnose
 * @desc Diagnosa masalah tanaman menggunakan AI
 * @access Private
 */
router.post("/diagnose", AIController.diagnoseProblem);

/**
 * @route POST /ai/care-advice
 * @desc Dapatkan saran perawatan tanaman dari AI
 * @access Private
 */
router.post("/care-advice", AIController.getCareAdvice);

module.exports = router;
