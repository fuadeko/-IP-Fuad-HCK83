const axios = require("axios");
const db = require("../models");
const cloudinary = require("cloudinary").v2;
const FormData = require("form-data");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Perbaikan: Gunakan PLANTNET_API_KEY yang benar
const PLANTNET_API_KEY = process.env.PLANTNET_API_KEY;
const PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify";

class PlantController {
  static async identifyPlant(req, res, next) {
    console.log("📸 Request file:", req.file ? "Ada" : "Tidak ada");
    console.log("📸 Request body:", req.body);

    if (!req.file) {
      return next({
        name: "Bad Request",
        message:
          "Tidak ada gambar yang diunggah. Pastikan field name adalah 'image'.",
      });
    }

    try {
      // 1. Upload ke Cloudinary dulu (ini pasti bekerja)
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`,
        {
          folder: "plant-images",
          resource_type: "image",
        }
      );
      const imageUrl = result.secure_url;
      console.log("✅ Cloudinary upload berhasil:", imageUrl);

      // 2. Coba PlantNet API dengan format yang benar
      const FormData = require("form-data");
      const form = new FormData();

      // Download image dari Cloudinary sebagai buffer
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });

      form.append("images", Buffer.from(imageResponse.data), {
        filename: "plant.jpg",
        contentType: "image/jpeg",
      });
      form.append("organs", "leaf");

      console.log("🔄 Mengirim request ke PlantNet...");

      // Test dengan beberapa endpoint
      const endpoints = ["weurope", "k-world-flora", "useful"];

      let plantNetData = null;
      let usedEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Mencoba endpoint: ${endpoint}`);

          const plantNetResponse = await axios.post(
            `https://my-api.plantnet.org/v2/identify/${endpoint}?api-key=${PLANTNET_API_KEY}`,
            form,
            {
              headers: {
                ...form.getHeaders(),
              },
              timeout: 15000,
            }
          );

          plantNetData = plantNetResponse.data;
          usedEndpoint = endpoint;
          console.log(`✅ PlantNet API berhasil dengan endpoint: ${endpoint}`);
          break;
        } catch (endpointError) {
          console.log(
            `❌ Endpoint ${endpoint} gagal:`,
            endpointError.response?.status,
            endpointError.response?.data?.message || endpointError.message
          );
          continue;
        }
      }

      // Jika semua endpoint gagal, return hasil Cloudinary saja
      if (!plantNetData) {
        console.log(
          "⚠️ Semua endpoint PlantNet gagal, return hasil upload saja"
        );
        return res.status(200).json({
          message:
            "Upload berhasil, tapi identifikasi PlantNet gagal. Silakan coba lagi.",
          identifiedData: {
            speciesName: "Tidak dapat diidentifikasi",
            commonName: "Silakan coba dengan gambar yang lebih jelas",
            score: 0,
            family: null,
            genus: null,
          },
          uploadedImageUrl: imageUrl,
          plantNetRawResponse: null,
          note: "PlantNet API tidak dapat diakses saat ini",
        });
      }

      // Parse hasil PlantNet
      let identifiedSpecies = {};
      if (
        plantNetData &&
        plantNetData.results &&
        plantNetData.results.length > 0
      ) {
        const topResult = plantNetData.results[0];

        identifiedSpecies = {
          speciesName:
            topResult.species?.scientificNameWithoutAuthor || "Tidak diketahui",
          commonName: topResult.species?.commonNames?.[0] || "Tidak diketahui",
          score: Math.round((topResult.score || 0) * 100),
          family:
            topResult.species?.family?.scientificNameWithoutAuthor || null,
          genus: topResult.species?.genus?.scientificNameWithoutAuthor || null,
        };
      } else {
        identifiedSpecies = {
          speciesName: "Tidak dapat diidentifikasi",
          commonName: "Silakan coba dengan gambar yang lebih jelas",
          score: 0,
          family: null,
          genus: null,
        };
      }

      console.log("✅ Identifikasi selesai:", identifiedSpecies);

      res.status(200).json({
        message: "Identifikasi berhasil!",
        identifiedData: identifiedSpecies,
        uploadedImageUrl: imageUrl,
        plantNetRawResponse: plantNetData,
        usedEndpoint: usedEndpoint,
      });
    } catch (error) {
      console.error("❌ ERROR DETAIL:");
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      next({
        name: "Internal Server Error",
        message: "Gagal mengidentifikasi tanaman. Silakan coba lagi.",
        detail: error.message,
      });
    }
  }
  static async addPlant(req, res, next) {
    const {
      nickname,
      speciesName,
      commonName,
      notes,
      acquisitionDate,
      location,
      imageUrl,
      needsLight,
      needsWater,
      needsHumidity,
    } = req.body;

    try {
      if (!commonName || commonName.trim() === "") {
        return next({
          name: "Bad Request",
          message: "Common Name is required and cannot be empty",
        });
      }
      let validAcquisitionDate = null;
      if (
        acquisitionDate &&
        acquisitionDate !== "Invalid date" &&
        acquisitionDate.trim() !== "" &&
        acquisitionDate !== "undefined"
      ) {
        const dateObj = new Date(acquisitionDate);
        if (!isNaN(dateObj.getTime())) {
          validAcquisitionDate = dateObj;
        }
      }
      const plant = await db.Plant.create({
        userId: req.user.id,
        nickname: nickname,
        speciesName: speciesName,
        commonName: commonName,
        notes: notes || null,
        acquisitionDate: validAcquisitionDate,
        location: location || null,
        imageUrl: imageUrl || null,
        needsLight: needsLight || false,
        needsWater: needsWater || false,
        needsHumidity: needsHumidity || false,
      });
      res.status(201).json({ message: "Tanaman berhasil ditambahkan!", plant });
    } catch (error) {
      console.error("Error menambahkan tanaman:", error);
      next(error);
    }
  }

  static async getAllPlants(req, res, next) {
    try {
      console.log("User ID:", req.user.id);
      console.log("Fetching plants for user...");

      const plants = await db.Plant.findAll({
        where: { userId: req.user.id },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.CareLog,
            as: "careLogs",
            required: false,
          },
        ],
      });

      console.log("Plants found:", plants.length);
      res.status(200).json(plants);
    } catch (error) {
      console.error("Error mendapatkan tanaman:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
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
