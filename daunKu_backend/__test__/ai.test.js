const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");

// Must mock these modules before requiring app
jest.mock("../controllers/aiController", () => ({
  diagnoseProblem: jest.fn((req, res) => {
    // Check for validation errors
    const { plantName, symptoms, environment } = req.body;
    if (!plantName || !symptoms || !environment) {
      return res
        .status(400)
        .json({ message: "Validation error: All fields are required" });
    }

    return res.status(200).json({
      diagnosis: "Mock diagnosis response",
      recommendations: ["Water less frequently", "Provide more light"],
    });
  }),
  getCareAdvice: jest.fn((req, res) => {
    // Check for validation errors
    const { plantName, plantType } = req.body;
    if (!plantName || !plantType) {
      return res
        .status(400)
        .json({ message: "Validation error: All fields are required" });
    }

    return res.status(200).json({
      advice: "Mock care advice response",
      tips: ["Water when soil is dry", "Keep away from direct sunlight"],
    });
  }),
}));

// Mock the auth middleware
jest.mock(
  "../middleware/auth",
  () =>
    function mockAuthentication(req, res, next) {
      if (!req.headers.authorization) {
        return res.status(401).json({ message: "Token not found" });
      }

      if (req.headers.authorization === "Bearer invalidtoken") {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.user = { id: 1 };
      next();
    }
);

// Mock JWT helper
jest.mock("../helpers/jwt", () => ({
  verifyToken: jest.fn(() => ({ id: 1 })),
  signToken: jest.fn(() => "mock_token"),
}));

// Mock User model
jest.mock("../models", () => ({
  User: {
    findByPk: jest.fn(() => ({ id: 1, email: "test@example.com" })),
  },
}));

// Import app after mocks are set up
const app = require("../app");

// Fixed token for tests
const access_token = "valid_mock_token";

beforeAll(() => {
  console.log("1. AI Routes beforeAll - Mock setup complete");
});

afterAll(() => {
  console.log("3. AI Routes Tests completed");
});

describe("POST /ai/diagnose", function () {
  it("should respond with diagnosis 200", async function () {
    const diagnosisData = {
      plantName: "Monstera Deliciosa",
      symptoms: "Daun menguning dan layu",
      environment: "Indoor, cahaya sedang, kelembaban rendah",
      careHistory: "Disiram 2 hari sekali",
    };

    const response = await request(app)
      .post("/ai/diagnose")
      .set("Authorization", `Bearer ${access_token}`)
      .send(diagnosisData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("diagnosis");
    expect(response.body).toHaveProperty("recommendations");
    expect(response.body.diagnosis).toEqual(expect.any(String));
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).post("/ai/diagnose");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 401 when token is not valid", async function () {
    const response = await request(app)
      .post("/ai/diagnose")
      .set("Authorization", `Bearer invalidtoken`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("should respond 400 when validation error", async function () {
    const diagnosisData = {
      plantName: "",
      symptoms: "",
      environment: "",
    };

    const response = await request(app)
      .post("/ai/diagnose")
      .set("Authorization", `Bearer ${access_token}`)
      .send(diagnosisData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});

describe("POST /ai/care-advice", function () {
  it("should respond with care advice 200", async function () {
    const adviceData = {
      plantName: "Monstera Deliciosa",
      plantType: "Indoor tropical plant",
      currentSeason: "winter",
      environment: "Indoor, medium light",
      specificQuestion: "How often should I water?",
    };

    const response = await request(app)
      .post("/ai/care-advice")
      .set("Authorization", `Bearer ${access_token}`)
      .send(adviceData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("advice");
    expect(response.body).toHaveProperty("tips");
    expect(response.body.advice).toEqual(expect.any(String));
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).post("/ai/care-advice");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 401 when token is not valid", async function () {
    const response = await request(app)
      .post("/ai/care-advice")
      .set("Authorization", `Bearer invalidtoken`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid token");
  });

  it("should respond 400 when validation error", async function () {
    const adviceData = {
      plantName: "",
      plantType: "",
    };

    const response = await request(app)
      .post("/ai/care-advice")
      .set("Authorization", `Bearer ${access_token}`)
      .send(adviceData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});
