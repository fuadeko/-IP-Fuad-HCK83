const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const app = require("../app");
const { hashPassword } = require("../helpers/bcrypt");
const { sequelize, User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { queryInterface } = sequelize;

let access_token;

beforeAll(async () => {
  console.log("1. beforeAll auth test jalan");

  // Clean up existing data
  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });

  // Create test user for login tests
  const testUser = {
    userName: "testuser",
    email: "test@example.com",
    password: await hashPassword("password123"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queryInterface.bulkInsert("Users", [testUser]);

  const user = await User.findOne({ where: { email: "test@example.com" } });
  access_token = signToken({ id: user.id });
});

afterAll(async () => {
  console.log("3. Drop auth test tables");

  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
  await sequelize.close();
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
