const express = require("express");
const multer = require("multer");
const PlantController = require("../controllers/plantController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route POST /api/plants/identify
 * @desc Mengidentifikasi tanaman dari gambar yang diunggah
 * @access Private
 */
router.post(
  "/identify",
  upload.single("plantImage"),
  PlantController.identifyPlant
);

/**
 * @route POST /api/plants
 * @desc Tambah tanaman baru ke koleksi user
 * @access Private
 */
router.post("/", PlantController.addPlant);

/**
 * @route GET /api/plants
 * @desc Dapatkan semua tanaman milik user
 * @access Private
 */
router.get("/", PlantController.getAllPlants);

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
router.put("/:id", PlantController.updatePlant);

/**
 * @route DELETE /api/plants/:id
 * @desc Hapus tanaman
 * @access Private
 */
router.delete("/:id", PlantController.deletePlant);

module.exports = router;
