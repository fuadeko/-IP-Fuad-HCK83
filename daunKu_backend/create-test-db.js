const { Client } = require('pg');
const config = require('./config/config.json').test;

async function createTestDatabase() {
  // Connect to postgres to create the database
  const adminClient = new Client({
    user: config.username,
    password: config.password,
    host: config.host,
    port: 5432,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL server');
    
    // Check if test database exists
    const checkDbResult = await adminClient.query(`
      SELECT 1 FROM pg_database WHERE datname = '${config.database}'
    `);
    
    // Create the database if it doesn't exist
    if (checkDbResult.rows.length === 0) {
      console.log(`Creating test database: ${config.database}`);
      await adminClient.query(`CREATE DATABASE "${config.database}";`);
      console.log(`Test database ${config.database} created successfully`);
    } else {
      console.log(`Test database ${config.database} already exists`);
    }
  } catch (err) {
    console.error('Error creating test database:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  createTestDatabase();
}

module.exports = createTestDatabase;
