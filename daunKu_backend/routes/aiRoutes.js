const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../models");

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post("/diagnose-problem", async (req, res, next) => {
  const { plantId, problemDescription, problemImageUrl } = req.body;

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

    let prompt = `Saya memiliki tanaman bernama "${plant.nickname}" (spesies: ${
      plant.speciesName || "tidak diketahui"
    }). `;
    prompt += `Tanaman ini memiliki masalah: "${problemDescription}". `;
    if (problemImageUrl) {
      prompt += `Gambar masalahnya dapat dilihat di ${problemImageUrl}. Tolong analisis deskripsi saya dan gambar ini (jika relevan). `;
    }
    prompt += `Tolong diagnosa kemungkinan penyebab masalah ini dan berikan saran perawatan yang spesifik dan singkat untuk mengatasinya. Format respons dalam bentuk poin-poin: Diagnosa, Solusi.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ message: "Diagnosis dan saran AI:", advice: text });
  } catch (error) {
    console.error("Error saat diagnosis AI:", error.message);
    next({
      name: "Internal Server Error",
      message: "Gagal mendapatkan diagnosis dari AI.",
      detail: error.message,
    });
  }
});

router.post("/care-advice", async (req, res, next) => {
  const { plantId, query } = req.body;

  try {
    let prompt = `Sebagai asisten perawatan tanaman DaunKu, berikan saran terkait: "${query}". `;

    if (plantId) {
      const plant = await db.Plant.findOne({
        where: { id: plantId, userId: req.user.id },
      });
      if (plant) {
        prompt += `Ini adalah tentang tanaman saya bernama "${
          plant.nickname
        }" (spesies: ${plant.speciesName || "tidak diketahui"}). `;
        prompt += `Kebutuhan cahaya: ${
          plant.needsLight || "tidak diketahui"
        }, kebutuhan air: ${
          plant.needsWater || "tidak diketahui"
        }, kelembaban: ${plant.needsHumidity || "tidak diketahui"}. `;
        if (plant.lastWatered) {
          prompt += `Terakhir disiram pada ${plant.lastWatered}. `;
        }
      }
    }
    prompt += `Berikan jawaban yang ringkas dan mudah dimengerti.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ message: "Saran AI:", advice: text });
  } catch (error) {
    console.error("Error saat mendapatkan saran AI:", error.message);
    next({
      name: "Internal Server Error",
      message: "Gagal mendapatkan saran dari AI.",
      detail: error.message,
    });
  }
});

router.post("/recommend-plant", async (req, res, next) => {
  const { userPreferences, currentPlantCollection } = req.body;

  try {
    let prompt = `Sebagai asisten DaunKu, saya ingin rekomendasi tanaman baru. Preferensi saya: "${userPreferences}". `;

    if (currentPlantCollection && currentPlantCollection.length > 0) {
      const plantNames = currentPlantCollection
        .map((p) => p.nickname || p.speciesName)
        .join(", ");
      prompt += `Saya sudah memiliki tanaman ini: ${plantNames}. `;
    }

    prompt += `Tolong rekomendasikan 3 tanaman yang cocok dengan preferensi saya dan koleksi yang sudah ada, serta berikan alasan singkat mengapa cocok dan tips perawatan singkat.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      message: "Rekomendasi tanaman baru dari AI:",
      recommendations: text,
    });
  } catch (error) {
    console.error("Error saat mendapatkan rekomendasi tanaman:", error.message);
    next({
      name: "Internal Server Error",
      message: "Gagal mendapatkan rekomendasi tanaman dari AI.",
      detail: error.message,
    });
  }
});

module.exports = router;
