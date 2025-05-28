const axios = require("axios");
const db = require("../models");
// const cloudinary = require("cloudinary").v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

const PLANTID_API_KEY = process.env.PLANTID_API_KEY;
const PLANTID_API_URL = "https://api.plant.id/v2/identify";

class PlantController {
  static async identifyPlant(req, res, next) {
    if (!req.file) {
      return next({
        name: "Bad Request",
        message: "Tidak ada gambar yang diunggah.",
      });
    }

    try {
      let imageUrl;

      if (process.env.NODE_ENV === "production") {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "plant-images",
          resource_type: "image",
        });
        imageUrl = result.secure_url;
      } else {
        imageUrl = "https://via.placeholder.com/400x300";
      }

      const plantIdResponse = await axios.post(
        PLANTID_API_URL,
        {
          images: [imageUrl],
          plant_details: [
            "common_names",
            "url",
            "wiki_description",
            "taxonomy",
            "gbif_id",
            "inaturalist_id",
            "image",
            "rank",
            "cuidados",
          ],
        },
        {
          headers: {
            "Api-Key": PLANTID_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const plantIdData = plantIdResponse.data;

      let identifiedSpecies = {};
      if (
        plantIdData &&
        plantIdData.suggestions &&
        plantIdData.suggestions.length > 0
      ) {
        const topSuggestion = plantIdData.suggestions[0];
        const plantDetails = topSuggestion.plant_details;

        identifiedSpecies = {
          speciesName: topSuggestion.plant_name,
          commonName: plantDetails.common_names
            ? plantDetails.common_names[0]
            : null,
          needsLight:
            plantDetails.wiki_description?.climate_and_habitat
              ?.light_requirements || null,
          needsWater:
            plantDetails.wiki_description?.climate_and_habitat
              ?.water_requirements || null,
          needsHumidity:
            plantDetails.wiki_description?.climate_and_habitat?.humidity ||
            null,
        };
      }

      res.status(200).json({
        message: "Identifikasi berhasil!",
        identifiedData: identifiedSpecies,
        uploadedImageUrl: imageUrl,
        plantIdRawResponse: plantIdData,
      });
    } catch (error) {
      console.error(
        "Error saat identifikasi atau unggah gambar:",
        error.response ? error.response.data : error.message
      );
      next({
        name: "Internal Server Error",
        message: "Gagal mengidentifikasi tanaman atau mengunggah gambar.",
        detail: error.response ? error.response.data : error.message,
      });
    }
  }
  static async addPlant(req, res, next) {
    const {
      nickname,
      speciesName,
      commonName,
      acquisitionDate,
      location,
      notes,
      imageUrl,
      needsLight,
      needsWater,
      needsHumidity,
    } = req.body;

    try {
      const plant = await db.Plant.create({
        userId: req.user.id,
        nickname,
        speciesName,
        commonName,
        acquisitionDate,
        location,
        notes,
        imageUrl,
        needsLight,
        needsWater,
        needsHumidity,
      });
      res.status(201).json({ message: "Tanaman berhasil ditambahkan!", plant });
    } catch (error) {
      console.error("Error menambahkan tanaman:", error);
      next(error);
    }
  }

  static async getAllPlants(req, res, next) {
    try {
      const plants = await db.Plant.findAll({
        where: { userId: req.user.id },
        order: [["createdAt", "DESC"]],
        include: [{ model: db.CareLog, as: "careLogs" }],
      });
      res.status(200).json(plants);
    } catch (error) {
      console.error("Error mendapatkan tanaman:", error);
      next(error);
    }
  }

  static async getPlantById(req, res, next) {
    try {
      const plant = await db.Plant.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{ model: db.CareLog, as: "careLogs" }],
      });

      if (!plant) {
        return next({ name: "NotFound", message: "Tanaman tidak ditemukan." });
      }
      res.status(200).json(plant);
    } catch (error) {
      console.error("Error mendapatkan detail tanaman:", error);
      next(error);
    }
  }

  static async updatePlant(req, res, next) {
    const {
      nickname,
      speciesName,
      commonName,
      acquisitionDate,
      location,
      notes,
      imageUrl,
      needsLight,
      needsWater,
      needsHumidity,
      lastWatered,
      nextWatering,
    } = req.body;

    try {
      const plant = await db.Plant.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!plant) {
        return next({ name: "NotFound", message: "Tanaman tidak ditemukan." });
      }

      await plant.update({
        nickname,
        speciesName,
        commonName,
        acquisitionDate,
        location,
        notes,
        imageUrl,
        needsLight,
        needsWater,
        needsHumidity,
        lastWatered,
        nextWatering,
      });

      res.status(200).json({ message: "Tanaman berhasil diperbarui!", plant });
    } catch (error) {
      console.error("Error memperbarui tanaman:", error);
      next(error);
    }
  }

  static async deletePlant(req, res, next) {
    try {
      const plant = await db.Plant.findOne({
        where: { id: req.params.id, userId: req.user.id },
      });

      if (!plant) {
        return next({ name: "NotFound", message: "Tanaman tidak ditemukan." });
      }

      await plant.destroy();
      res.status(200).json({ message: "Tanaman berhasil dihapus!" });
    } catch (error) {
      console.error("Error menghapus tanaman:", error);
      next(error);
    }
  }
  static async getPlantStats(req, res, next) {
    try {
      const userId = req.user.id;
      const totalPlants = await db.Plant.count({
        where: { userId },
      });

      const plantsNeedingWater = await db.Plant.count({
        where: {
          userId,
          nextWatering: {
            [db.Sequelize.Op.lte]: new Date(),
          },
        },
      });

      const totalCareLogs = await db.CareLog.count({
        include: [
          {
            model: db.Plant,
            where: { userId },
          },
        ],
      });

      const stats = {
        totalPlants,
        plantsNeedingWater,
        totalCareLogs,
        healthyPlants: totalPlants - plantsNeedingWater,
      };

      res.status(200).json({
        message: "Statistik tanaman berhasil diambil!",
        stats,
      });
    } catch (error) {
      console.error("Error mendapatkan statistik tanaman:", error);
      next(error);
    }
  }
}

module.exports = PlantController;
