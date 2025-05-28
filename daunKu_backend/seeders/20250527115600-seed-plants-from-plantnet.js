"use strict";
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const PLANTNET_API_KEY = process.env.PLANTID_API_KEY;
const PLANTNET_SPECIES_API_URL = "https://my-api.plantnet.org/v2/species";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let userIdToUse = null;

    try {
      console.log("Mulai seeding tanaman dari PlantNet API...");
      console.log("Nilai PLANTID_API_KEY dari .env:", PLANTNET_API_KEY);

      if (!PLANTNET_API_KEY) {
        console.error(
          "ERROR: PLANTID_API_KEY tidak ditemukan di environment. Seeding dibatalkan."
        );
        throw new Error("PLANTID_API_KEY tidak ditemukan.");
      }
      console.log("Mencari user dummy 'admin.test@daunku.com' di database...");
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'admin.test@daunku.com' LIMIT 1;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      console.log("Hasil query user:", users);

      if (users && users.length > 0) {
        userIdToUse = users[0].id;
      } else {
        console.error(
          "User dummy 'admin.test@daunku.com' tidak ditemukan di database. Pastikan seeder user sudah dijalankan dan user tersebut ada."
        );
        throw new Error("User ID untuk seeding tanaman tidak ditemukan.");
      }

      console.log(`Menggunakan User ID: ${userIdToUse} untuk seeding tanaman.`);

      const response = await axios.get(PLANTNET_SPECIES_API_URL, {
        params: {
          "api-key": PLANTNET_API_KEY,
          lang: "en",
          page: 1,
          pageSize: 10,
        },
      });

      const plantData = response.data;

      if (!plantData || plantData.length === 0) {
        console.warn("Tidak ada data spesies yang diterima dari PlantNet API.");
        return;
      }

      const plantsToSeed = plantData.map((plant) => {
        const commonName =
          plant.commonNames && plant.commonNames.length > 0
            ? plant.commonNames[0]
            : null;

        return {
          userId: userIdToUse,
          nickname:
            commonName || plant.scientificNameWithoutAuthor || "Unknown Plant",
          speciesName: plant.scientificNameWithoutAuthor || null,
          commonName: commonName,
          acquisitionDate: new Date(),
          location: "Seeded Location",
          notes: "Data dari PlantNet API",
          imageUrl: null,
          needsLight: null,
          needsWater: null,
          needsHumidity: null,
          lastWatered: null,
          nextWatering: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      await queryInterface.bulkInsert("plants", plantsToSeed, {});
      console.log(
        `Berhasil seeding ${plantsToSeed.length} tanaman dari PlantNet API.`
      );
    } catch (error) {
      console.error(
        "Gagal seeding tanaman dari PlantNet API:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "plants",
      { notes: "Data dari PlantNet API" },
      {}
    );
  },
};
