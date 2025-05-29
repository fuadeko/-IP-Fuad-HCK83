const db = require("../models");

class CareLogController {
  // Tambah log perawatan baru
  static async addCareLog(req, res, next) {
    const {
      plantId,
      careType,
      date = new Date(),
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
        type: careType,
        date,
        notes,
        problemDescription,
        problemImageUrl,
        solution,
      });

      if (careType === "watering") {
        plant.lastWatered = date;
        await plant.save();
      }

      res.status(201).json({
        message: "Log perawatan berhasil ditambahkan.",
        careLog,
      });
    } catch (error) {
      next(error);
    }
  }

  // Dapatkan semua log perawatan untuk tanaman tertentu
  static async getCareLogsByPlant(req, res, next) {
    const { plantId } = req.params;

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

      const careLogs = await db.CareLog.findAll({
        where: { plantId },
        order: [["date", "DESC"]],
      });

      res.status(200).json({
        message: "Log perawatan berhasil diambil.",
        careLogs,
      });
    } catch (error) {
      next(error);
    }
  }

  // Dapatkan semua log perawatan user
  static async getAllCareLogs(req, res, next) {
    try {
      const careLogs = await db.CareLog.findAll({
        include: [
          {
            model: db.Plant,
            as: "plant", // ✅ Tambahkan alias yang sesuai
            where: { userId: req.user.id },
            attributes: ["id", "nickname", "speciesName"],
          },
        ],
        order: [["date", "DESC"]],
      });

      res.status(200).json({
        message: "Semua log perawatan berhasil diambil.",
        careLogs,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update log perawatan
  static async updateCareLog(req, res, next) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const careLog = await db.CareLog.findOne({
        where: { id },
        include: [
          {
            model: db.Plant,
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

      await careLog.update(updateData);

      res.status(200).json({
        message: "Log perawatan berhasil diperbarui.",
        careLog,
      });
    } catch (error) {
      next(error);
    }
  }

  // Hapus log perawatan
  static async deleteCareLog(req, res, next) {
    const { id } = req.params;

    try {
      const careLog = await db.CareLog.findOne({
        where: { id },
        include: [
          {
            model: db.Plant,
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

      res.status(200).json({
        message: "Log perawatan berhasil dihapus.",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CareLogController;
