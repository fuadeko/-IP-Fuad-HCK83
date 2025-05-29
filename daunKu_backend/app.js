require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const authentication = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const plantRoutes = require("./routes/plantRoutes");
const careLogRoutes = require("./routes/careLogRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/plants", authentication, plantRoutes);
app.use("/care-logs", authentication, careLogRoutes);
app.use("/ai", authentication, aiRoutes);

app.get("/", (req, res) => {
  res.send("Selamat datang di DaunKu - Platform Perawatan Tanaman!");
});

app.use(errorHandler);

// Export app untuk testing
module.exports = app;

// Hanya jalankan server jika bukan dalam mode testing
