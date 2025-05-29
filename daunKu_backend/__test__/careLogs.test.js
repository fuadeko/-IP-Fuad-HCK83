const request = require("supertest");
const { describe, it, expect, beforeAll, afterAll } = require("@jest/globals");
const app = require("../app");
const { hashPassword } = require("../helpers/bcrypt");
const { sequelize, User, Plant, CareLog } = require("../models");
const { signToken } = require("../helpers/jwt");
const { queryInterface } = sequelize;

let access_token;
let testUserId;
let testPlantId;
let testCareLogId;

beforeAll(async () => {
  console.log("1. Care Logs beforeAll jalan");

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
  access_token = signToken({ id: user.id });

  // Create test plant
  const testPlant = {
    name: "Test Plant",
    species: "Test species",
    location: "Test location",
    plantingDate: new Date(),
    userId: testUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queryInterface.bulkInsert("Plants", [testPlant]);

  const plant = await Plant.findOne({ where: { userId: testUserId } });
  testPlantId = plant.id;
});

afterAll(async () => {
  console.log("3. Care Logs Drop table");

  await queryInterface.bulkDelete("CareLogs", null, {
    truncate: true,
    restartIdentity: true,
    cascade: true,
  });
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
  beforeAll(async () => {
    // Create a test care log first
    const careLogData = {
      plantId: testPlantId,
      careType: "fertilizing",
      notes: "Test care log",
      careDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await queryInterface.bulkInsert("CareLogs", [careLogData]);
    const careLog = await CareLog.findOne({ where: { plantId: testPlantId } });
    testCareLogId = careLog.id;
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
