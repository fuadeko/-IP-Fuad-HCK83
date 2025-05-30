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
const Plant = mocks.Plant;
const CareLog = mocks.CareLog;

// Custom mock data for care logs tests
const mockCareLogs = [
  {
    ...mockCareLog,
    id: 1,
  },
  {
    ...mockCareLog,
    id: 2,
    type: "fertilizing",
    careType: "fertilizing",
    notes: "Added fertilizer",
  },
];

// Override default mocks for specific test cases
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Setup custom mock returns for CareLog functions
  CareLog.findAll.mockImplementation((query) => {
    if (query?.where?.plantId === 1) {
      return mockCareLogs;
    }
    return [];
  });

  CareLog.findByPk.mockImplementation((id) => {
    if (id === 1) {
      return {
        ...mockCareLog,
        id: 1,
        save: jest.fn().mockResolvedValue(mockCareLog),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      };
    } else if (id === 2) {
      return {
        ...mockCareLog,
        id: 2,
        type: "fertilizing",
        careType: "fertilizing",
        notes: "Added fertilizer",
        save: jest.fn().mockResolvedValue(mockCareLog),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      };
    } else if (id === 99999) {
      return null; // Not found case
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
let testCareLogId = 1;

beforeAll(() => {
  console.log("1. Care Logs beforeAll jalan");
  // No database setup needed with mocks
});

afterAll(async () => {
  console.log("3. Care Logs Drop table");

  try {
    // Mock cleanup is sufficient for our tests
    // No need to actually delete from the database since we're using mocks
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
});

describe("GET /care-logs", function () {
  it("should respond with care logs array 200", async function () {
    const response = await request(app)
      .get("/care-logs")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).get("/care-logs");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });
});

describe("POST /care-logs/add-care", function () {
  it("should respond with new care log 201", async function () {
    const careLogData = {
      plantId: testPlantId,
      careType: "watering",
      notes: "Penyiraman rutin pagi hari",
      careDate: "2024-01-20",
    };

    const response = await request(app)
      .post("/care-logs/add-care")
      .set("Authorization", `Bearer ${access_token}`)
      .send(careLogData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id", expect.any(Number));
    expect(response.body).toHaveProperty("careType", careLogData.careType);
    expect(response.body).toHaveProperty("plantId", testPlantId);

    testCareLogId = response.body.id;
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).post("/care-logs/add-care");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 400 when validation error", async function () {
    const careLogData = {
      plantId: "",
      careType: "",
      notes: "",
    };

    const response = await request(app)
      .post("/care-logs/add-care")
      .set("Authorization", `Bearer ${access_token}`)
      .send(careLogData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /care-logs/plant/:plantId", function () {
  it("should respond with plant care logs 200", async function () {
    const response = await request(app)
      .get(`/care-logs/plant/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("should respond 404 when plant not found", async function () {
    const response = await request(app)
      .get("/care-logs/plant/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("PUT /care-logs/updatecare/:id", function () {
  beforeAll(() => {
    // Using the mock data that's already set up
    testCareLogId = mockCareLogs[0].id;
  });

  it("should respond with updated care log 200", async function () {
    const updateData = {
      careType: "pruning",
      notes: "Updated care log notes",
    };

    const response = await request(app)
      .put(`/care-logs/updatecare/${testCareLogId}`)
      .set("Authorization", `Bearer ${access_token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("careType", updateData.careType);
    expect(response.body).toHaveProperty("notes", updateData.notes);
  });

  it("should respond 404 when care log not found", async function () {
    const response = await request(app)
      .put("/care-logs/updatecare/99999")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ careType: "watering" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("DELETE /care-logs/delete/:id", function () {
  it("should respond with success message 200", async function () {
    const response = await request(app)
      .delete(`/care-logs/delete/${testCareLogId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 404 when care log not found", async function () {
    const response = await request(app)
      .delete("/care-logs/delete/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /care-logs/:id", function () {
  it("should respond with care log detail 200", async function () {
    const response = await request(app)
      .get(`/care-logs/${testCareLogId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", testCareLogId);
    expect(response.body).toHaveProperty("careType");
  });

  it("should respond 404 when care log not found", async function () {
    const response = await request(app)
      .get("/care-logs/9999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).get(`/care-logs/${testCareLogId}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });
});

describe("GET /care-logs/statistics/:plantId", function () {
  it("should respond with care log statistics 200", async function () {
    const response = await request(app)
      .get(`/care-logs/statistics/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalLogs");
    expect(response.body).toHaveProperty("careTypeCounts");
  });

  it("should respond 404 when plant not found", async function () {
    const response = await request(app)
      .get("/care-logs/statistics/9999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});
