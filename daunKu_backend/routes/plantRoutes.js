const express = require("express");
const multer = require("multer");
const PlantController = require("../controllers/plantController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ===== PLANT IDENTIFICATION =====
/**
 * @route POST /plants/identify
 * @desc Mengidentifikasi tanaman dari gambar yang diunggah
 * @access Private
 */
router.post(
  "/identify",
  upload.single("plantImage"),
  PlantController.identifyPlant
);

// ===== PLANT CRUD OPERATIONS =====
/**
 * @route GET /plants
 * @desc Dapatkan semua tanaman milik user (Collection)
 * @access Private
 */
router.get("/", PlantController.getAllPlants);

/**
 * @route POST /api/plants
 * @desc Tambah tanaman baru ke koleksi user
 * @access Private
 */
router.post("/add-plant", PlantController.addPlant);

router.get("/stats/summary", PlantController.getPlantStats);
/**
 * @route GET /api/plants/:id
 * @desc Dapatkan detail tanaman berdasarkan ID
 * @access Private
 */
router.get("/:id", PlantController.getPlantById);

/**
 * @route PUT /api/plants/:id
 * @desc Update informasi tanaman
 * @access Private
 */
router.put("/update/:id", PlantController.updatePlant);

/**
 * @route DELETE /api/plants/:id
 * @desc Hapus tanaman dari koleksi
 * @access Private
 */
router.delete("/delete/:id", PlantController.deletePlant);

// ===== PLANT STATISTICS =====
/**
 * @route GET /api/plants/stats/summary
 * @desc Dapatkan ringkasan statistik tanaman user
 * @access Private
 */

module.exports = router;
