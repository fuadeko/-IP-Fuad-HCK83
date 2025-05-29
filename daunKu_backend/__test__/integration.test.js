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
  console.log("1. Integration Tests beforeAll jalan");

  // Create test user
  const testUser = {
    userName: "integrationuser",
    email: "integration@example.com",
    password: await hashPassword("password123"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await queryInterface.bulkInsert("Users", [testUser]);

  const user = await User.findOne({
    where: { email: "integration@example.com" },
  });
  testUserId = user.id;
  access_token = signToken({ id: user.id });
});

afterAll(async () => {
  console.log("3. Integration Tests Drop table");
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

    // Clean up new user
    await queryInterface.bulkDelete("Users", {
      email: newUserData.email,
    });
  });
});
