const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../models");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

class AIController {
  // Diagnosa masalah tanaman
  static async diagnoseProblem(req, res, next) {
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
  }

  // Saran perawatan tanaman
  static async getCareAdvice(req, res, next) {
    const { plantId, careType } = req.body;

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
      prompt += `Tolong berikan saran perawatan untuk ${careType || "perawatan umum"} tanaman ini. `;
      prompt += `Berikan saran yang spesifik, praktis, dan mudah diikuti.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({ message: "Saran perawatan AI:", advice: text });
    } catch (error) {
      console.error("Error saat mendapatkan saran AI:", error.message);
      next({
        name: "Internal Server Error",
        message: "Gagal mendapatkan saran dari AI.",
        detail: error.message,
      });
    }
  }
}

module.exports = AIController;