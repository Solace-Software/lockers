const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function initializeData() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gym_lockers',
    user: process.env.DB_USER || require('os').userInfo().username,
    password: process.env.DB_PASSWORD || ''
  });
  
  try {
    console.log('🔄 Starting data initialization...');
    
    // Get a client for transaction
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Create admin user
      console.log('1️⃣ Creating admin user...');
      const passwordHash = await bcrypt.hash('admin', 10);
      const { rows: [adminUser] } = await client.query(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['admin', 'admin@example.com', passwordHash, 'admin', 'Admin', 'User']);
      
      // Create test group
      console.log('2️⃣ Creating test group...');
      const { rows: [testGroup] } = await client.query(`
        INSERT INTO locker_groups (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING id
      `, ['Test Group', 'A test group for development', '#3B82F6']);
      
      // Create test lockers
      console.log('3️⃣ Creating test lockers...');
      for (let i = 1; i <= 2; i++) {
        const { rows: [locker] } = await client.query(`
          INSERT INTO lockers (
            locker_id, name, location, status, ip_address,
            topic, num_locks, api_token, controller_type,
            last_heartbeat, uptime, is_online
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          `M${i}`,
          `Test Locker ${i}`,
          'Test Location',
          'available',
          '192.168.68.101',
          `lockers/M${i}`,
          2,
          '0524d5',
          'locker',
          new Date(),
          0,
          true
        ]);
        
        // Add locker to test group
        await client.query(`
          INSERT INTO group_lockers (group_id, locker_id)
          VALUES ($1, $2)
        `, [testGroup.id, locker.id]);
      }
      
      // Create default settings
      console.log('4️⃣ Creating default settings...');
      await client.query(`
        INSERT INTO settings (key, value, description)
        VALUES 
          ('mqtt_broker', '{"host":"localhost","port":1883}', 'MQTT broker connection settings'),
          ('heartbeat_timeout', '300', 'Locker heartbeat timeout in seconds')
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Data initialization completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeData(); 