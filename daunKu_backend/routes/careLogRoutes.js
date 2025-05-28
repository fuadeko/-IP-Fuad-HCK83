const express = require("express");
const db = require("../models");

const router = express.Router();

/**
 * @route POST /api/care-logs
 * @desc Tambah log perawatan baru untuk tanaman
 * @access Private (melalui middleware di server.js)
 */
router.post("/", async (req, res, next) => {
  const {
    plantId,
    type,
    date,
    notes,
    problemDescription,
    problemImageUrl,
    solution,
  } = req.body;

  try {
    const plant = await db.Plant.findOne({
      where: { id: plantId, userId: req.user.id },
    });

    if (!plant) {
      return next({
        name: "NotFound",
        message: "Tanaman tidak ditemukan atau bukan milik Anda.",
      });
    }

    const careLog = await db.CareLog.create({
      plantId,
      type,
      date,
      notes,
      problemDescription,
      problemImageUrl,
      solution,
    });

    if (type === "watering") {
      plant.lastWatered = date;
      await plant.save();
    }

    res
      .status(201)
      .json({ message: "Log perawatan berhasil ditambahkan!", careLog });
  } catch (error) {
    console.error("Error menambahkan log perawatan:", error);
    next(error);
  }
});

/**
 * @route GET /api/care-logs/:plantId
 * @desc Dapatkan semua log perawatan untuk tanaman tertentu
 * @access Private (melalui middleware di server.js)
 */
router.get("/:plantId", async (req, res, next) => {
  try {
    const plant = await db.Plant.findOne({
      where: { id: req.params.plantId, userId: req.user.id },
    });

    if (!plant) {
      return next({
        name: "NotFound",
        message: "Tanaman tidak ditemukan atau bukan milik Anda.",
      });
    }

    const careLogs = await db.CareLog.findAll({
      where: { plantId: req.params.plantId },
      order: [["date", "DESC"]],
    });
    res.status(200).json(careLogs);
  } catch (error) {
    console.error("Error mendapatkan log perawatan:", error);
    next(error);
  }
});

/**
 * @route PUT /api/care-logs/:id
 * @desc Update log perawatan
 * @access Private (melalui middleware di server.js)
 */
router.put("/:id", async (req, res, next) => {
  const { type, date, notes, problemDescription, problemImageUrl, solution } =
    req.body;
  try {
    const careLog = await db.CareLog.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.Plant,
          as: "plant",
          where: { userId: req.user.id },
        },
      ],
    });

    if (!careLog) {
      return next({
        name: "NotFound",
        message: "Log perawatan tidak ditemukan atau bukan milik Anda.",
      });
    }

    await careLog.update({
      type,
      date,
      notes,
      problemDescription,
      problemImageUrl,
      solution,
    });
    res
      .status(200)
      .json({ message: "Log perawatan berhasil diperbarui!", careLog });
  } catch (error) {
    console.error("Error memperbarui log perawatan:", error);
    next(error);
  }
});

/**
 * @route DELETE /api/care-logs/:id
 * @desc Hapus log perawatan
 * @access Private (melalui middleware di server.js)
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const careLog = await db.CareLog.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.Plant,
          as: "plant",
          where: { userId: req.user.id },
        },
      ],
    });

    if (!careLog) {
      return next({
        name: "NotFound",
        message: "Log perawatan tidak ditemukan atau bukan milik Anda.",
      });
    }

    await careLog.destroy();
    res.status(200).json({ message: "Log perawatan berhasil dihapus!" });
  } catch (error) {
    console.error("Error menghapus log perawatan:", error);
    next(error);
  }
});

module.exports = router;
