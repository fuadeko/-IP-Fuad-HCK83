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
  console.log("1. Plants beforeAll jalan");

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
});

afterAll(async () => {
  console.log("3. Plants Drop table");

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
      name: "Monstera Deliciosa",
      species: "Monstera deliciosa",
      location: "Ruang tamu",
      plantingDate: "2024-01-15",
      notes: "Tanaman hias favorit",
    };

    const response = await request(app)
      .post("/plants/add-plant")
      .set("Authorization", `Bearer ${access_token}`)
      .send(plantData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id", expect.any(Number));
    expect(response.body).toHaveProperty("name", plantData.name);
    expect(response.body).toHaveProperty("species", plantData.species);

    testPlantId = response.body.id;
  });

  it("should respond 401 when token not found", async function () {
    const response = await request(app).post("/plants/add-plant");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Token not found");
  });

  it("should respond 400 when validation error", async function () {
    const plantData = {
      name: "",
      species: "",
      location: "",
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
  beforeAll(async () => {
    // Create a test plant first
    const plantData = {
      name: "Test Plant",
      species: "Test species",
      location: "Test location",
      plantingDate: new Date(),
      userId: testUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await queryInterface.bulkInsert("Plants", [plantData]);
    const plant = await Plant.findOne({ where: { userId: testUserId } });
    testPlantId = plant.id;
  });

  it("should respond with plant detail 200", async function () {
    const response = await request(app)
      .get(`/plants/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", testPlantId);
    expect(response.body).toHaveProperty("name");
  });

  it("should respond 404 when plant not found", async function () {
    const response = await request(app)
      .get("/plants/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("PUT /plants/update/:id", function () {
  it("should respond with updated plant 200", async function () {
    const updateData = {
      name: "Updated Plant Name",
      location: "Updated location",
      notes: "Updated notes",
    };

    const response = await request(app)
      .put(`/plants/update/${testPlantId}`)
      .set("Authorization", `Bearer ${access_token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("name", updateData.name);
    expect(response.body).toHaveProperty("location", updateData.location);
  });

  it("should respond 404 when plant not found", async function () {
    const response = await request(app)
      .put("/plants/update/99999")
      .set("Authorization", `Bearer ${access_token}`)
      .send({ name: "Test" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
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
    const response = await request(app)
      .delete("/plants/delete/99999")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});

describe("GET /plants/stats/summary", function () {
  it("should respond with plant statistics 200", async function () {
    const response = await request(app)
      .get("/plants/stats/summary")
      .set("Authorization", `Bearer ${access_token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalPlants", expect.any(Number));
    expect(response.body).toHaveProperty("plantsByLocation");
  });
});
