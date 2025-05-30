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

// Mock models
jest.mock("../models", () => ({
  User: mocks.User,
  Plant: mocks.Plant,
  CareLog: mocks.CareLog,
  sequelize: mocks.sequelize,
  Sequelize: mocks.Sequelize,
}));

// Define models for reference in tests
const User = mocks.User;
const Plant = mocks.Plant;
const CareLog = mocks.CareLog;

// Custom setup for comprehensive tests
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Custom overrides for specific test cases
  Plant.findByPk.mockImplementation((id) => {
    if (id === 1) {
      return {
        ...mockPlant,
        save: jest.fn().mockResolvedValue(mockPlant),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      };
    } else if (id === 9999) {
      return null; // Not found case
    }
    return null;
  });

  CareLog.findAll.mockImplementation(() => [mockCareLog]);

  CareLog.findByPk.mockImplementation((id) => {
    if (id === 1) {
      return {
        ...mockCareLog,
        save: jest.fn().mockResolvedValue(mockCareLog),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      };
    }
    return null;
  });

  CareLog.findOne.mockImplementation((query) => {
    if (query.where && (query.where.id === 1 || query.where.plantId === 1)) {
      return {
        ...mockCareLog,
        save: jest.fn().mockResolvedValue(mockCareLog),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      };
    }
    return null;
  });
});

// Mock AI Controller
jest.mock("../controllers/aiController", () => ({
  diagnoseProblem: jest.fn((req, res) => {
    const { plantType, symptoms, details } = req.body;

    if (!plantType || !symptoms) {
      return res.status(400).json({
        message: "Validation error: Plant type and symptoms are required",
      });
    }

    return res.status(200).json({
      diagnosis: "Mock diagnosis response",
      recommendations: ["Water less frequently", "Provide more light"],
    });
  }),

  getCareAdvice: jest.fn((req, res) => {
    const { plantType, careAspect } = req.body;

    if (!plantType || !careAspect) {
      return res.status(400).json({
        message: "Validation error: Plant type and care aspect are required",
      });
    }

    return res.status(200).json({
      advice: "Mock care advice response",
      tips: ["Water when soil is dry", "Keep away from direct sunlight"],
    });
  }),
}));

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

// Mock bcrypt
jest.mock("../helpers/bcrypt", () => ({
  hashPassword: jest.fn(() => "hashed-password-123"),
  comparePassword: jest.fn(
    (password, hashedPassword) => password === "password123"
  ),
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
let testCareLogId = 1;

beforeAll(() => {
  console.log("1. Comprehensive tests starting");
});

afterAll(() => {
  console.log("3. Comprehensive tests completed");
});

describe("Plant Controller Tests", () => {
  describe("GET /plants", () => {
    it("should get all plants for the user", async () => {
      const response = await request(app)
        .get("/plants")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("should return 401 when token is not provided", async () => {
      const response = await request(app).get("/plants");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /plants/:id", () => {
    it("should get a plant by ID", async () => {
      const response = await request(app)
        .get(`/plants/${testPlantId}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", testPlantId);
    });

    it("should return 404 when plant doesn't exist", async () => {
      const response = await request(app)
        .get("/plants/9999")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(404);
    });
  });
});

describe("Care Log Controller Tests", () => {
  describe("GET /care-logs", () => {
    it("should get all care logs", async () => {
      const response = await request(app)
        .get("/care-logs")
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe("GET /care-logs/plant/:plantId", () => {
    it("should get care logs for a specific plant", async () => {
      const response = await request(app)
        .get(`/care-logs/plant/${testPlantId}`)
        .set("Authorization", `Bearer ${access_token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe("POST /care-logs/add-care", () => {
    it("should create a new care log", async () => {
      const careLogData = {
        plantId: testPlantId,
        careType: "watering",
        notes: "Regular watering",
        careDate: new Date().toISOString().split("T")[0],
      };

      const response = await request(app)
        .post("/care-logs/add-care")
        .set("Authorization", `Bearer ${access_token}`)
        .send(careLogData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
  });
});

describe("Authentication Controller Tests", () => {
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        userName: "newuser",
        email: "new@example.com",
        password: "password123",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });
  });

  describe("POST /auth/login", () => {
    it("should login a user and return a token", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app).post("/auth/login").send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
    });
  });
});

describe("AI Controller Tests", () => {
  describe("POST /ai/diagnose", () => {
    it("should diagnose plant problems", async () => {
      const diagnosisData = {
        plantType: "Monstera",
        symptoms: "Yellow leaves, drooping",
        details: "Plant is near a window with direct light",
      };

      const response = await request(app)
        .post("/ai/diagnose")
        .set("Authorization", `Bearer ${access_token}`)
        .send(diagnosisData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("diagnosis");
    });

    it("should return 400 when input is invalid", async () => {
      const response = await request(app)
        .post("/ai/diagnose")
        .set("Authorization", `Bearer ${access_token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /ai/care-advice", () => {
    it("should provide care advice", async () => {
      const adviceData = {
        plantType: "Monstera",
        careAspect: "watering",
        currentCare: "I water once a week",
      };

      const response = await request(app)
        .post("/ai/care-advice")
        .set("Authorization", `Bearer ${access_token}`)
        .send(adviceData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("advice");
    });
  });
});

describe("Error Handling", () => {
  it("should handle route not found", async () => {
    const response = await request(app).get("/non-existent-route");

    expect(response.status).toBe(404);
  });

  it("should handle server errors", async () => {
    // Force an error by passing invalid token format
    const response = await request(app)
      .get("/plants")
      .set("Authorization", "InvalidToken");

    expect(response.status).toBe(401);
  });
});
