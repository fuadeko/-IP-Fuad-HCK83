const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const app = require("../app");
const { hashPassword } = require("../helpers/bcrypt");
const { sequelize, User, Plant } = require("../models"); // Pastikan Plant di-impor
const { signToken } = require("../helpers/jwt");
const { queryInterface } = sequelize;

let access_token;
let testUserId;

// === SETUP & TEARDOWN GLOBAL ===
beforeAll(async () => {
  console.log("1. Memulai setup global: Membuat user untuk pengujian...");

  // Membuat user tes
  const testUser = {
    userName: "testuser",
    email: "test@example.com",
    password: await hashPassword("password123"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Menggunakan create agar lebih bersih dan bisa mendapatkan user instance,
  // namun bulkInsert juga tidak masalah di sini.
  await queryInterface.bulkInsert("Users", [testUser]);

  const user = await User.findOne({ where: { email: "test@example.com" } });
  testUserId = user.id;
  access_token = signToken({ id: user.id });
});

afterAll(async () => {
  console.log("3. Menjalankan teardown global: Menghapus semua data...");

  // Membersihkan tabel Plants dan Users untuk memastikan database bersih setelah tes
  await queryInterface.bulkDelete("Plants", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await sequelize.close();
});

// === KUMPULAN TES ===

describe("GET /plants - Mengambil semua tanaman", function () {
  it("should respond with an array of plants and status 200", async function () {
    const response = await request(app)
      .get("/plants")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("should respond with status 401 when token is not provided", async function () {
    const response = await request(app).get("/plants");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });
});

describe("POST /plants/add-plant - Menambah tanaman baru", function () {
  it("should respond with the new plant and status 201 on success", async function () {
    const plantData = {
      name: "Monstera Deliciosa",
      species: "Monstera deliciosa",
      location: "Ruang tamu",
      plantingDate: "2024-01-15",
      notes: "Tanaman hias favorit",
    };

    const response = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(plantData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id", expect.any(Number));
    expect(response.body).toHaveProperty("name", plantData.name);
    expect(response.body).toHaveProperty("species", plantData.species);
  });

  it("should respond with status 401 when token is not provided", async function () {
    const response = await request(app).post("/plants/add-plant");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond with status 400 when there is a validation error (e.g., empty name)", async function () {
    const invalidPlantData = {
      name: "", // Nama tidak boleh kosong
      species: "Aglonema",
      location: "Kamar",
    };

    const response = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(invalidPlantData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message"); // Harusnya ada pesan error validasi
  });
});

describe("GET /plants/:id - Mengambil detail satu tanaman", function () {
  let plantIdForThisBlock;

  // Membuat tanaman spesifik untuk dites di dalam blok ini
  beforeAll(async () => {
    const plant = await Plant.create({
      name: "Test Plant for Detail View",
      species: "Test species",
      location: "Test location",
      plantingDate: new Date(),
      userId: testUserId,
    });
    plantIdForThisBlock = plant.id;
  });

  it("should respond with plant detail and status 200", async function () {
    const response = await request(app)
      .get(`/plants/${plantIdForThisBlock}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", plantIdForThisBlock);
    expect(response.body).toHaveProperty("name", "Test Plant for Detail View");
  });

  it("should respond with status 404 when plant is not found", async function () {
    const response = await request(app)
      .get("/plants/99999") // ID yang tidak mungkin ada
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("PUT /plants/update/:id - Memperbarui tanaman", function () {
  let plantIdToUpdate;

  // Membuat tanaman spesifik untuk diperbarui
  beforeAll(async () => {
    const plant = await Plant.create({
      name: "Plant to be Updated",
      species: "Original Species",
      location: "Original Location",
      userId: testUserId,
    });
    plantIdToUpdate = plant.id;
  });

  it("should respond with the updated plant and status 200", async function () {
    const updateData = {
      name: "Updated Plant Name",
      location: "Updated Location",
      notes: "Updated notes",
    };

    const response = await request(app)
      .put(`/plants/update/${plantIdToUpdate}`)
      .set("Authorization", `Bearer ${access_token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", updateData.name);
    expect(response.body).toHaveProperty("location", updateData.location);
  });

  it("should respond with status 404 when plant to update is not found", async function () {
    const response = await request(app)
      .put("/plants/update/99999") // ID yang tidak mungkin ada
      .set("Authorization", `Bearer ${access_token}`)
      .send({ name: "Test" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("DELETE /plants/delete/:id - Menghapus tanaman", function () {
  let plantIdToDelete;

  // Membuat tanaman spesifik untuk dihapus
  beforeAll(async () => {
    const plant = await Plant.create({
      name: "Plant to be Deleted",
      species: "Delete Species",
      location: "Delete Location",
      userId: testUserId,
    });
    plantIdToDelete = plant.id;
  });

  it("should respond with a success message and status 200", async function () {
    const response = await request(app)
      .delete(`/plants/delete/${plantIdToDelete}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond with status 404 when plant to delete is not found", async function () {
    const response = await request(app)
      .delete("/plants/delete/99999") // ID yang tidak mungkin ada
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /plants/stats/summary - Mengambil statistik tanaman", function () {
  it("should respond with plant statistics and status 200", async function () {
    const response = await request(app)
      .get("/plants/stats/summary")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalPlants", expect.any(Number));
    expect(response.body).toHaveProperty("plantsByLocation");
  });
});
