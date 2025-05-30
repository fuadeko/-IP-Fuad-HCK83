const { sequelize } = require("./models");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function setupTestDatabase() {
  try {
    console.log("Setting up test database...");

    // Ensure we're using test environment
    process.env.NODE_ENV = "test";

    // Drop all tables first to ensure clean state
    await sequelize.drop();
    console.log("Dropped all tables");

    // Force sync all models - this will create tables according to models
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");

    // Now run migrations to ensure schema is up to date
    try {
      console.log("Running migrations...");
      await execPromise("npx sequelize-cli db:migrate --env test");
      console.log("Migrations applied successfully");
    } catch (migrateError) {
      console.error("Migration error:", migrateError.message);
      console.log("Continuing with synced models...");
      // Continue anyway as sync has created the tables already
    }

    console.log("Test database setup completed");
  } catch (error) {
    console.error("Error setting up test database:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase;
