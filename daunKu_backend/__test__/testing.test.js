const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");

// Mock data
const mockPlants = [
  {
    id: 1,
    userId: 1,
    nickname: "Test Plant",
    commonName: "Common Test Plant",
    speciesName: "Test species",
    location: "Test location",
    acquisitionDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Import the mocks
const { mockPlant, mockCareLog, createMocks } = require("./unified-mock");

// Create mock instances
const mocks = createMocks();

// Mock models
jest.mock("../models", () => ({
  User: mocks.User,
  Plant: mocks.Plant,
  CareLog: mocks.CareLog,
  sequelize: mocks.sequelize,
  Sequelize: mocks.Sequelize,
}));

// Define Plant for reference in tests
const Plant = mocks.Plant;

// Mock JWT helper
jest.mock("../helpers/jwt", () => ({
  signToken: jest.fn(() => "mock-access-token"),
  verifyToken: jest.fn((token) => {
    if (token === "mock-access-token") {
      return { id: 1 };
    }
    throw new Error("Invalid token");
  }),
}));

// Mock authentication middleware
jest.mock(
  "../middleware/auth",
  () =>
    function mockAuthentication(req, res, next) {
      if (req.headers.authorization === "Bearer mock-access-token") {
        req.user = { id: 1 };
        next();
      } else {
        res.status(401).json({ message: "Token not found" });
      }
    }
);

// Mock bcrypt for password hashing
jest.mock("../helpers/bcrypt", () => ({
  hashPassword: jest.fn(() => "hashed-password-123"),
  comparePassword: jest.fn(
    (password, hashedPassword) => password === "password123"
  ),
}));

// Load app after mocks are set up
const app = require("../app");

let access_token = "mock-access-token";
let testUserId = 1;
let testPlantId = 1;

beforeAll(() => {
  console.log("1. Testing Tests beforeAll jalan");
});

afterAll(() => {
  console.log("3. Testing Tests completed");
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

describe("Plant API Integration Tests", function () {
  describe("GET /plants", function () {
    it("should get all plants for the user", async function () {
      const response = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return 401 when token is not provided", async function () {
      const response = await request(app).get("/plants");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /plants/:id", function () {
    it("should get a specific plant by ID", async function () {
      const response = await request(app)
        .get(`/plants/${testPlantId}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", testPlantId);
    });
  });
});

describe("Error Handling", function () {
  it("should handle route not found", async function () {
    const response = await request(app)
      .get("/non-existent-route")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
  });
});
