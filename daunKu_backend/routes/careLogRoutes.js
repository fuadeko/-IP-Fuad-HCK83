const express = require("express");
const CareLogController = require("../controllers/careLogController");

const router = express.Router();

// ===== CARE LOG CRUD OPERATIONS =====
/**
 * @route GET /care-logs
 * @desc Dapatkan semua log perawatan milik user
 * @access Private
 */
router.get("/", CareLogController.getAllCareLogs);

/**
 * @route POST /care-logs/add-care
 * @desc Tambah log perawatan baru untuk tanaman
 * @access Private
 */
router.post("/add-care", CareLogController.addCareLog);

/**
 * @route GET /care-logs/plant/:plantId
 * @desc Dapatkan semua log perawatan untuk tanaman tertentu
 * @access Private
 */
router.get("/plant/:plantId", CareLogController.getCareLogsByPlant);

/**
 * @route PUT /care-logs/:id
 * @desc Update log perawatan
 * @access Private
 */
router.put("/updatecare/:id", CareLogController.updateCareLog);

/**
 * @route DELETE /api/care-logs/:id
 * @desc Hapus log perawatan
 * @access Private
 */
router.delete("/delete/:id", CareLogController.deleteCareLog);

module.exports = router;
