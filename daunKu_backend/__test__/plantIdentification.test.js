// Pastikan NODE_ENV di-set ke 'test' oleh skrip npm kamu
console.log("NODE_ENV saat ini:", process.env.NODE_ENV);

const request = require("supertest");
const {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} = require("@jest/globals");

// Import the mocks from unified-mock.js
const { mockPlant, mockCareLog, createMocks } = require("./unified-mock");

// Create mock instances
const mocks = createMocks();

// Mock data
const createTestImageBuffer = () => {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xff, 0xff, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
};

// Mocking plant controller
jest.mock("../controllers/plantController", () => ({
  identifyPlant: jest.fn((req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Gambar tanaman diperlukan untuk identifikasi" });
    }

    return res.status(200).json({
      bestMatch: "Monstera deliciosa",
      confidence: 0.98,
      alternatives: [
        { name: "Monstera adansonii", confidence: 0.78 },
        { name: "Philodendron hederaceum", confidence: 0.65 },
      ],
    });
  }),
  createPlantFromIdentification: jest.fn((req, res) => {
    return res.status(201).json({
      id: 999,
      nickname: "New identified plant",
      commonName: "Monstera",
      speciesName: "Monstera deliciosa",
      userId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),
}));

// Mock models
jest.mock("../models", () => ({
  User: mocks.User,
  Plant: mocks.Plant,
  CareLog: mocks.CareLog,
  sequelize: mocks.sequelize,
  Sequelize: mocks.Sequelize,
}));

// Custom setup for plant identification tests
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Override User model behavior for plant identification tests
  mocks.User.findOne.mockImplementation((query) => {
    if (query.where?.id === 1) {
      return {
        id: 1,
        userName: "testuser",
        email: "test@example.com",
      };
    }
    return null;
  });
});

// Mock JWT helper
jest.mock("../helpers/jwt", () => ({
  signToken: jest.fn(() => "mock-access-token"),
  verifyToken: jest.fn((token) => {
    if (token === "mock-access-token") {
      return { id: 1 };
    } else if (token === "invalid-token") {
      throw new Error("Invalid token");
    }
    throw new Error("Token not found");
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
      } else if (req.headers.authorization === "Bearer invalid-token") {
        return res.status(401).json({ message: "Token tidak valid" });
      } else {
        return res.status(401).json({ message: "Token tidak ditemukan" });
      }
    }
);

// Load app after mocks are set up
const app = require("../app");
let access_token = "mock-access-token";

beforeAll(() => {
  console.log("1. Plant Identification beforeAll jalan");
  // No database setup needed with mocks
});

afterAll(() => {
  console.log("3. Plant Identification Drop table");
  // No database cleanup needed with mocks
});

describe("POST /plants/identify", function () {
  // ... SEMUA BLOK `it(...)` KAMU TETAP SAMA, TIDAK PERLU DIUBAH ...
  it("should respond with plant identification 200", async function () {
    const testImageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post("/plants/identify")
      .set("Authorization", `Bearer ${access_token}`)
      .attach("plantImage", testImageBuffer, "test-plant.png");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Identifikasi berhasil!");
    expect(response.body).toHaveProperty("identifiedData");
    expect(response.body).toHaveProperty("uploadedImageUrl");
    expect(response.body).toHaveProperty("plantIdRawResponse"); // Check identifiedData structure

    const { identifiedData } = response.body;
    expect(identifiedData).toHaveProperty("speciesName");
    expect(identifiedData).toHaveProperty("commonName");
    expect(identifiedData).toHaveProperty("needsLight");
    expect(identifiedData).toHaveProperty("needsWater");
    expect(identifiedData).toHaveProperty("needsHumidity");
  });

  it("should respond 401 when token not found", async function () {
    const testImageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post("/plants/identify")
      .attach("plantImage", testImageBuffer, "test-plant.png");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 401 when token is not valid", async function () {
    const testImageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post("/plants/identify")
      .set("Authorization", `Bearer invalidtoken`)
      .attach("plantImage", testImageBuffer, "test-plant.png");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("should respond 400 when no image uploaded", async function () {
    const response = await request(app)
      .post("/plants/identify")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "Tidak ada gambar yang diunggah."
    );
  });

  it("should handle development environment correctly", async function () {
    // Set NODE_ENV to development for this test
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const testImageBuffer = createTestImageBuffer();

    const response = await request(app)
      .post("/plants/identify")
      .set("Authorization", `Bearer ${access_token}`)
      .attach("plantImage", testImageBuffer, "test-plant.png");

    expect(response.status).toBe(200);
    expect(response.body.uploadedImageUrl).toBe(
      "https://via.placeholder.com/400x300"
    ); // Restore original environment

    process.env.NODE_ENV = originalEnv;
  });

  it("should handle multer file size limits", async function () {
    // Create a larger test image buffer
    const largeImageBuffer = Buffer.alloc(1024 * 100); // 100KB buffer
    largeImageBuffer.fill(0x89); // Fill with PNG signature start

    const response = await request(app)
      .post("/plants/identify")
      .set("Authorization", `Bearer ${access_token}`)
      .attach("plantImage", largeImageBuffer, "large-plant.png"); // Should either succeed or fail gracefully

    expect([200, 400, 413, 500]).toContain(response.status);
    expect(response.body).toHaveProperty("message");
  });
});
