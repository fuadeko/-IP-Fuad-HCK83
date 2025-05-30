const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");

// Import the mocks from unified-mock.js
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

// Load app after mocks are set up
const app = require("../app");

let access_token = "mock-access-token";
let testUserId = 1;
let testPlantId = 1;

beforeAll(() => {
  console.log("1. Plants beforeAll jalan");
  // No database setup needed with mocks
});

afterAll(() => {
  console.log("3. Plants Drop table");
  // No database cleanup needed with mocks
});

describe("GET /plants", function () {
  it("should respond with plants array 200", async function () {
    const response = await request(app)
      .get("/plants")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).get("/plants");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });
});

describe("POST /plants/add-plant", function () {
  it("should respond with new plant 201", async function () {
    const plantData = {
      nickname: "Monstera Deliciosa",
      commonName: "Monstera",
      speciesName: "Monstera deliciosa",
      location: "Ruang tamu",
      notes: "Tanaman hias favorit",
    };

    const response = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(plantData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("plant");
    expect(response.body.plant).toHaveProperty("id");
    expect(response.body.plant).toHaveProperty("nickname", plantData.nickname);
    expect(response.body.plant).toHaveProperty(
      "speciesName",
      plantData.speciesName
    );

    testPlantId = 1; // Use fixed ID for tests
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).post("/plants/add-plant");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 400 when validation error", async function () {
    const plantData = {
      nickname: "Invalid Plant",
      // Missing commonName which is required
      speciesName: "Test species",
      location: "Test location",
    };

    const response = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(plantData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /plants/:id", function () {
  it("should respond with plant detail 200", async function () {
    const response = await request(app)
      .get(`/plants/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", testPlantId);
    expect(response.body).toHaveProperty("nickname");
  });

  it("should respond 404 when plant not found", async function () {
    // Mock Plant.findByPk to return null for ID 99999
    const originalFindByPk = Plant.findByPk;
    Plant.findByPk = jest.fn((id) => {
      if (id === 99999) return null;
      return originalFindByPk(id);
    });

    const response = await request(app)
      .get("/plants/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");

    // Restore original mock
    Plant.findByPk = originalFindByPk;
  });
});

describe("PUT /plants/update/:id", function () {
  it("should respond with updated plant 200", async function () {
    const updateData = {
      nickname: "Updated Plant Name",
      location: "Updated location",
      notes: "Updated notes",
    };

    const response = await request(app)
      .put(`/plants/update/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("plant");
    expect(response.body.plant).toHaveProperty("nickname", updateData.nickname);
    expect(response.body.plant).toHaveProperty("location", updateData.location);
  });

  it("should respond 404 when plant not found", async function () {
    // Mock Plant.findByPk to return null for ID 99999
    const originalFindByPk = Plant.findByPk;
    Plant.findByPk = jest.fn((id) => {
      if (id === 99999) return null;
      return originalFindByPk(id);
    });

    const response = await request(app)
      .put("/plants/update/99999")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ nickname: "Test" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");

    // Restore original mock
    Plant.findByPk = originalFindByPk;
  });
});

describe("DELETE /plants/delete/:id", function () {
  it("should respond with success message 200", async function () {
    const response = await request(app)
      .delete(`/plants/delete/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 404 when plant not found", async function () {
    // Mock Plant.findByPk to return null for ID 99999
    const originalFindByPk = Plant.findByPk;
    Plant.findByPk = jest.fn((id) => {
      if (id === 99999) return null;
      return originalFindByPk(id);
    });

    const response = await request(app)
      .delete("/plants/delete/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");

    // Restore original mock
    Plant.findByPk = originalFindByPk;
  });
});

describe("GET /plants/stats/summary", function () {
  it("should respond with plant statistics 200", async function () {
    const response = await request(app)
      .get("/plants/stats/summary")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("stats");
    expect(response.body.stats).toHaveProperty(
      "totalPlants",
      expect.any(Number)
    );
  });
});
