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

// Custom setup for integration tests
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Override User model behavior for integration tests
  User.findOne.mockImplementation((query) => {
    if (
      query.where?.email === "integration@example.com" ||
      query.where?.id === 4
    ) {
      return {
        id: 4,
        userName: "integrationuser",
        email: "integration@example.com",
        password: "hashed-password-123",
      };
    } else if (query.where?.email === "newintegration@example.com") {
      return {
        id: 1,
        userName: "newintegrationuser",
        email: "newintegration@example.com",
        password: "hashed-password-789",
      };
    }
    return null;
  });

  User.create.mockImplementation((userData) => ({
    id: 1,
    ...userData,
  }));

  // Override Plant model behavior
  Plant.findAll.mockImplementation(() => [mockPlant]);

  Plant.findOne.mockImplementation((query) => ({
    ...mockPlant,
    save: jest.fn().mockResolvedValue(mockPlant),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  }));

  Plant.findByPk.mockImplementation((id) => ({
    ...mockPlant,
    save: jest.fn().mockResolvedValue(mockPlant),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  }));

  Plant.create.mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue({ id: 1, ...data }),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  }));

  // Override CareLog model behavior
  CareLog.findAll.mockImplementation(() => [mockCareLog]);

  CareLog.findByPk.mockImplementation(() => ({
    ...mockCareLog,
    save: jest.fn().mockResolvedValue(mockCareLog),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  }));

  CareLog.create.mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue({ id: 1, ...data }),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  }));
});

// Mock JWT helper
jest.mock("../helpers/jwt", () => ({
  signToken: jest.fn(() => "mock-access-token"),
  verifyToken: jest.fn((token) => {
    if (token === "mock-access-token") {
      return { id: 4 };
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
        req.user = { id: 4 };
        next();
      } else {
        res.status(401).json({ message: "Token tidak ditemukan" });
      }
    }
);

// Mock AI controller
jest.mock("../controllers/aiController", () => ({
  diagnoseProblem: jest.fn((req, res) => {
    if (req.headers.authorization === "Bearer mock-access-token") {
      return res.status(200).json({
        diagnosis: "Mock diagnosis result",
        recommendations: ["Mock recommendation 1", "Mock recommendation 2"],
      });
    } else {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }
  }),
  getCareAdvice: jest.fn((req, res) => {
    if (req.headers.authorization === "Bearer mock-access-token") {
      return res.status(200).json({
        advice: "Mock care advice result",
        tips: ["Mock tip 1", "Mock tip 2"],
      });
    } else {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }
  }),
}));

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
let testUserId = 4;
let testPlantId = 1;
let testCareLogId = 1;

beforeAll(() => {
  console.log("1. Integration Tests beforeAll jalan");
  // No database setup needed with mocks
});

afterAll(() => {
  console.log("3. Integration Tests Drop table");
  // No database cleanup needed with mocks
});

describe("Integration Tests - Complete Plant Management Flow", function () {
  it("should complete full plant management workflow", async function () {
    // 1. Add a new plant
    const plantData = {
      name: "Integration Test Plant",
      species: "Monstera deliciosa",
      location: "Living room",
      plantingDate: "2024-01-15",
      notes: "Test plant for integration",
    };

    const addPlantResponse = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(plantData);

    expect(addPlantResponse.status).toBe(201);
    testPlantId = addPlantResponse.body.id;

    // 2. Get all plants to verify addition
    const getPlantsResponse = await request(app)
      .get("/plants")
      .set("Authorization", `Bearer ${access_token}`);

    expect(getPlantsResponse.status).toBe(200);
    expect(getPlantsResponse.body.length).toBeGreaterThan(0);

    // 3. Add care log for the plant
    const careLogData = {
      plantId: testPlantId,
      careType: "watering",
      notes: "Integration test watering",
      careDate: "2024-01-20",
    };

    const addCareResponse = await request(app)
      .post("/care-logs/add-care")
      .set("Authorization", `Bearer ${access_token}`)
      .send(careLogData);

    expect(addCareResponse.status).toBe(201);
    testCareLogId = addCareResponse.body.id;

    // 4. Get care logs for the plant
    const getCareLogsResponse = await request(app)
      .get(`/care-logs/plant/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(getCareLogsResponse.status).toBe(200);
    expect(getCareLogsResponse.body.length).toBeGreaterThan(0);

    // 5. Get AI care advice for the plant
    const aiAdviceData = {
      plantName: plantData.name,
      plantType: plantData.species,
      currentSeason: "winter",
      environment: "Indoor",
      specificQuestion: "How often should I water?",
    };

    const aiAdviceResponse = await request(app)
      .post("/ai/care-advice")
      .set("Authorization", `Bearer ${access_token}`)
      .send(aiAdviceData);

    expect(aiAdviceResponse.status).toBe(200);
    expect(aiAdviceResponse.body).toHaveProperty("advice");

    // 6. Update the plant
    const updatePlantData = {
      name: "Updated Integration Plant",
      location: "Bedroom",
    };

    const updatePlantResponse = await request(app)
      .put(`/plants/update/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`)
      .send(updatePlantData);

    expect(updatePlantResponse.status).toBe(200);
    expect(updatePlantResponse.body.name).toBe(updatePlantData.name);

    // 7. Get plant statistics
    const statsResponse = await request(app)
      .get("/plants/stats/summary")
      .set("Authorization", `Bearer ${access_token}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body).toHaveProperty("totalPlants");
    expect(statsResponse.body.totalPlants).toBeGreaterThan(0);

    // 8. Clean up - delete care log and plant
    await request(app)
      .delete(`/care-logs/delete/${testCareLogId}`)
      .set("Authorization", `Bearer ${access_token}`);

    await request(app)
      .delete(`/plants/delete/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);
  });

  it("should handle AI diagnosis workflow", async function () {
    const diagnosisData = {
      plantName: "Test Plant",
      symptoms: "Yellowing leaves",
      environment: "Indoor, low light",
      careHistory: "Watered daily",
    };

    const diagnosisResponse = await request(app)
      .post("/ai/diagnose")
      .set("Authorization", `Bearer ${access_token}`)
      .send(diagnosisData);

    expect(diagnosisResponse.status).toBe(200);
    expect(diagnosisResponse.body).toHaveProperty("diagnosis");
    expect(diagnosisResponse.body).toHaveProperty("recommendations");
  });
  it("should handle user authentication flow", async function () {
    // Test registration
    const newUserData = {
      userName: "newintegrationuser",
      email: "newintegration@example.com",
      password: "password123",
    };

    const registerResponse = await request(app)
      .post("/auth/register")
      .send(newUserData);

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toHaveProperty(
      "message",
      "User registered successfully"
    );

    // Test login
    const loginData = {
      email: newUserData.email,
      password: newUserData.password,
    };

    const loginResponse = await request(app)
      .post("/auth/login")
      .send(loginData);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty("access_token");
    expect(loginResponse.body).toHaveProperty("user");

    // No need to clean up since we're using mocks
    // User.destroy.mockResolvedValueOnce(1);
  });
});

describe("Negative & Edge Case Coverage", () => {
  it("should return 401 if no token is provided for protected routes", async () => {
    const res1 = await request(app).get("/plants");
    expect(res1.status).toBe(401);
    const res2 = await request(app).post("/plants/add-plant").send({});
    expect(res2.status).toBe(401);
    const res3 = await request(app).post("/care-logs/add-care").send({});
    expect(res3.status).toBe(401);
    const res4 = await request(app).post("/ai/diagnose").send({});
    expect(res4.status).toBe(401);
  });

  it("should return 404 for non-existent plant", async () => {
    Plant.findByPk.mockImplementationOnce(() => null);
    const res = await request(app)
      .get("/plants/99999")
      .set("Authorization", `Bearer ${access_token}`);
    expect(res.status).toBe(404);
  });

  it("should return 404 for non-existent care log", async () => {
    CareLog.findByPk.mockImplementationOnce(() => null);
    const res = await request(app)
      .get("/care-logs/99999")
      .set("Authorization", `Bearer ${access_token}`);
    expect(res.status).toBe(404);
  });

  it("should return 400 for invalid plant creation data", async () => {
    const res = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid care log creation data", async () => {
    const res = await request(app)
      .post("/care-logs/add-care")
      .set("Authorization", `Bearer ${access_token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid AI diagnose data", async () => {
    const res = await request(app)
      .post("/ai/diagnose")
      .set("Authorization", `Bearer ${access_token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid AI care advice data", async () => {
    const res = await request(app)
      .post("/ai/care-advice")
      .set("Authorization", `Bearer ${access_token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("should return 401 for invalid token", async () => {
    const res = await request(app)
      .get("/plants")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
  });

  it("should return 404 for unknown route", async () => {
    const res = await request(app)
      .get("/this-route-does-not-exist")
      .set("Authorization", `Bearer ${access_token}`);
    expect(res.status).toBe(404);
  });

  it("should return 400 for duplicate user registration", async () => {
    User.create.mockImplementationOnce(() => {
      throw { name: "SequelizeUniqueConstraintError" };
    });
    const res = await request(app)
      .post("/auth/register")
      .send({
        userName: "integrationuser",
        email: "integration@example.com",
        password: "password123",
      });
    expect(res.status).toBe(400);
  });

  it("should return 401 for login with wrong password", async () => {
    User.findOne.mockImplementationOnce(() => ({
      id: 4,
      userName: "integrationuser",
      email: "integration@example.com",
      password: "hashed-password-123",
    }));
    // Simulate comparePassword returning false
    require("../helpers/bcrypt").comparePassword.mockImplementationOnce(
      () => false
    );
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "integration@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });
});
