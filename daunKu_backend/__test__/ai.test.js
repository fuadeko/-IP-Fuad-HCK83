const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const app = require("../app");
const { hashPassword } = require("../helpers/bcrypt");
const { sequelize, User, Plant } = require("../models");
const { signToken } = require("../helpers/jwt");
const { queryInterface } = sequelize;

let access_token;
let testUserId;
let testPlantId;

beforeAll(async () => {
  console.log("1. AI Routes beforeAll jalan");

  // Create test user
  const testUser = {
    userName: "testuser",
    email: "test@example.com",
    password: await hashPassword("password123"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queryInterface.bulkInsert("Users", [testUser]);

  const user = await User.findOne({ where: { email: "test@example.com" } });
  testUserId = user.id;
  access_token = await hashPassword({ id: user.id });

  // Create test plant
  const testPlant = {
    name: "Monstera Deliciosa",
    species: "Monstera deliciosa",
    location: "Ruang tamu",
    plantingDate: new Date("2024-01-15"),
    notes: "Tanaman hias favorit",
    userId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queryInterface.bulkInsert("Plants", [testPlant]);

  const plant = await Plant.findOne({ where: { userId: testUserId } });
  testPlantId = plant.id;
});

afterAll(async () => {
  console.log("3. AI Routes Drop table");

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
