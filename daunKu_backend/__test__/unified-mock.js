// A unified mock module for all tests

// Mock data
const mockPlant = {
  id: 1,
  userId: 1,
  nickname: "Test Plant",
  commonName: "Common Test Plant",
  speciesName: "Test species",
  location: "Test location",
  acquisitionDate: new Date(),
  lastWatered: new Date(),
  nextWatering: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCareLog = {
  id: 1,
  plantId: 1,
  type: "watering",
  careType: "watering",
  notes: "Watered plant",
  date: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Create proper mocks for models
const createMocks = () => {
  // Create enhanced plant object with methods
  const enhancedPlant = {
    ...mockPlant,
    save: jest.fn().mockResolvedValue(mockPlant),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  };

  // Create enhanced care log with methods
  const enhancedCareLog = {
    ...mockCareLog,
    save: jest.fn().mockResolvedValue(mockCareLog),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
  };

  return {
    User: {
      findOne: jest.fn((query) => {
        if (
          query.where?.email === "test@example.com" ||
          query.where?.id === 1
        ) {
          return {
            id: 1,
            userName: "testuser",
            email: "test@example.com",
            password: "hashed-password-123",
          };
        }
        return null;
      }),
      create: jest.fn((userData) => ({
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      update: jest.fn(() => [1]),
      destroy: jest.fn(() => 1),
    },
    Plant: {
      findAll: jest.fn(() => [enhancedPlant]),
      findOne: jest.fn((query) => {
        if (
          query?.where &&
          (query.where.id === 1 || query.where.userId === 1)
        ) {
          return enhancedPlant;
        }
        return null;
      }),
      findByPk: jest.fn((id) => {
        if (id === 1) return enhancedPlant;
        return null;
      }),
      count: jest.fn(() => 1),
      findAndCountAll: jest.fn(() => ({ count: 1, rows: [enhancedPlant] })),
      create: jest.fn((data) => {
        if (!data.commonName) {
          throw { 
            name: "SequelizeValidationError", 
            errors: [{ message: "Common Name is required and cannot be empty" }] 
          };
        }
        return {
          id: 1,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          save: jest.fn().mockResolvedValue({ id: 1, ...data }),
          update: jest.fn().mockResolvedValue([1]),
          destroy: jest.fn().mockResolvedValue(1),
        };
      }),
      update: jest.fn(() => [1]),
      destroy: jest.fn(() => 1),
    },
    CareLog: {
      findAll: jest.fn((query) => {
        return [enhancedCareLog];
      }),
      findOne: jest.fn((query) => {
        if (
          query?.where &&
          (query.where.id === 1 || query.where.plantId === 1)
        ) {
          return enhancedCareLog;
        }
        return null;
      }),
      findByPk: jest.fn((id) => {
        if (id === 1) return enhancedCareLog;
        return null;
      }),
      count: jest.fn(() => 1),
      findAndCountAll: jest.fn(() => ({ count: 1, rows: [enhancedCareLog] })),
      create: jest.fn((data) => ({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue({ id: 1, ...data }),
        update: jest.fn().mockResolvedValue([1]),
        destroy: jest.fn().mockResolvedValue(1),
      })),
      update: jest.fn(() => [1]),
      destroy: jest.fn(() => 1),
    },
    sequelize: {
      authenticate: jest.fn(),
      close: jest.fn(),
      fn: jest.fn(() => 1),
      col: jest.fn((col) => col),
      literal: jest.fn((text) => text),
      query: jest.fn(() => [{ count: 1 }]),
      transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn()
      }))
    },
    Sequelize: {
      Op: {
        gte: Symbol("gte"),
        lte: Symbol("lte"),
        eq: Symbol("eq"),
        ne: Symbol("ne"),
        like: Symbol("like"),
        in: Symbol("in"),
        notIn: Symbol("notIn")
      }
    },
  };
};

module.exports = {
  mockPlant,
  mockCareLog,
  createMocks,
};
