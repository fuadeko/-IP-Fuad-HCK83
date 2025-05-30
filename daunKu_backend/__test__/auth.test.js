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

// Mock bcrypt helper
jest.mock("../helpers/bcrypt", () => ({
  hashPassword: jest.fn(() => "hashed-password-123"),
  comparePassword: jest.fn((password, hashedPassword) => {
    // For testing login success and failure cases
    if (password === "password123") return true;
    return false;
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

// Custom setup for auth tests
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Override User model for specific auth test cases
  mocks.User.findOne.mockImplementation((query) => {
    if (query.where?.email === "test@example.com") {
      return {
        id: 1,
        userName: "testuser",
        email: "test@example.com",
        password: "hashed-password-123",
      };
    } else if (query.where?.id === 1) {
      return {
        id: 1,
        userName: "testuser",
        email: "test@example.com",
        password: "hashed-password-123",
      };
    }
    return null;
  });

  mocks.User.create.mockImplementation((userData) => {
    if (userData.email === "newuser@example.com") {
      return {
        id: 2,
        ...userData,
      };
    } else if (userData.email === "test@example.com") {
      throw { name: "SequelizeUniqueConstraintError" };
    }
    return userData;
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

// Mock Google OAuth
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(({ idToken }) => {
      if (idToken === "valid-google-token") {
        return {
          getPayload: jest.fn(() => ({
            email: "google@example.com",
            name: "Google User",
            picture: "https://example.com/photo.jpg",
          })),
        };
      }
      throw new Error("Invalid token");
    }),
  })),
}));

// Load app after mocks are set up
const app = require("../app");
const { signToken } = require("../helpers/jwt");

let access_token = "mock-access-token";

beforeAll(() => {
  console.log("1. beforeAll auth test jalan");
  // No need for database setup since we're mocking
});

afterAll(() => {
  console.log("3. Drop auth test tables");
  // No need for database cleanup
});

describe("POST /auth/register", function () {
  it("should respond with status 201 and create new user", async function () {
    const userData = {
      userName: "newuser",
      email: "newuser@example.com",
      password: "password123",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "User berhasil didaftarkan"
    );
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", userData.email);
    expect(response.body.user).toHaveProperty("userName", userData.userName);
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should respond 400 when email already exists", async function () {
    const userData = {
      userName: "testuser2",
      email: "test@example.com",
      password: "password123",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 400 when validation error (empty fields)", async function () {
    const userData = {
      userName: "",
      email: "",
      password: "",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 400 when password too short", async function () {
    const userData = {
      userName: "shortpass",
      email: "shortpass@example.com",
      password: "123",
    };

    const response = await request(app).post("/auth/register").send(userData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});

describe("POST /auth/login", function () {
  it("should respond with status 200 and return token", async function () {
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    const response = await request(app).post("/auth/login").send(loginData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Login berhasil!");
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", loginData.email);
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should respond 401 when email not found", async function () {
    const loginData = {
      email: "notfound@example.com",
      password: "password123",
    };

    const response = await request(app).post("/auth/login").send(loginData);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Email atau password salah"
    );
  });

  it("should respond 401 when password is wrong", async function () {
    const loginData = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    const response = await request(app).post("/auth/login").send(loginData);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Email atau password salah"
    );
  });

  it("should respond 400 when validation error (missing fields)", async function () {
    const loginData = {
      email: "",
      password: "",
    };

    const response = await request(app).post("/auth/login").send(loginData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});

describe("POST /auth/google", function () {
  it("should respond 400 when idToken is missing", async function () {
    const response = await request(app).post("/auth/google").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should respond 401 when idToken is invalid", async function () {
    const googleData = {
      idToken: "invalid_token_here",
    };

    const response = await request(app).post("/auth/google").send(googleData);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty(
      "message",
      "Google authentication failed"
    );
  });

  it("should work in development mode with mock data", async function () {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const googleData = {
      idToken: "mock_token_for_development",
    };

    const response = await request(app).post("/auth/google").send(googleData);

    process.env.NODE_ENV = originalEnv;

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Login berhasil!");
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
  });
});
