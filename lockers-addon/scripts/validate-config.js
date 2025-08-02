const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function validateDatabaseConnection(config) {
  console.log('🔍 Validating database configuration...');
  
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name
    });

    // Test the connection
    await connection.query('SELECT 1');
    console.log('✅ Database connection successful');

    // Test permissions
    await testDatabasePermissions(connection);
    console.log('✅ Database permissions verified');

    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    return false;
  }
}

async function testDatabasePermissions(connection) {
  try {
    // Test CREATE TABLE permission
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _permission_test (
        id INT PRIMARY KEY
      )
    `);

    // Test INSERT permission
    await connection.query('INSERT INTO _permission_test (id) VALUES (1)');

    // Test CREATE INDEX permission
    await connection.query('CREATE INDEX idx_test ON _permission_test (id)');

    // Clean up
    await connection.query('DROP TABLE _permission_test');
  } catch (error) {
    throw new Error(`Insufficient database permissions: ${error.message}`);
  }
}

async function validateConfig() {
  try {
    // Read Home Assistant addon configuration
    const configPath = '/data/options.json';
    if (!fs.existsSync(configPath)) {
      console.error('❌ Configuration file not found');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Validate required database fields
    const requiredDbFields = ['host', 'port', 'name', 'username', 'password'];
    const missingFields = requiredDbFields.filter(field => !config.database[field]);

    if (missingFields.length > 0) {
      console.error('❌ Missing required database configuration:', missingFields.join(', '));
      process.exit(1);
    }

    // Validate database connection
    const isValid = await validateDatabaseConnection(config);
    if (!isValid) {
      process.exit(1);
    }

    console.log('✅ Configuration validation successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
validateConfig();