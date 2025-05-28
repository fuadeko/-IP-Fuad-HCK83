require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const app = express();
const PORT = process.env.PORT || 3000;

const authentication = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const plantRoutes = require("./routes/plantRoutes");
const careLogRoutes = require("./routes/careLogRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use(cors());
app.use(express.json());

async function connectToDb() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi ke database PostgreSQL berhasil.");
  } catch (error) {
    console.error("Koneksi database gagal:", error);
  }
}

app.use("/auth", authRoutes);
app.use("/plants", authentication, plantRoutes);
app.use("/care-logs", authentication, careLogRoutes);
app.use("/ai", authentication, aiRoutes);

app.get("/", (req, res) => {
  res.send("Selamat datang di DaunKu - Platform Perawatan Tanaman!");
});

app.use(errorHandler);

connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server DaunKu berjalan di port ${PORT}`);
  });
});
