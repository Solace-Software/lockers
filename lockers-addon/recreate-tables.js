const { Pool } = require('pg');

async function recreateTables() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gym_lockers',
    user: process.env.DB_USER || require('os').userInfo().username,
    password: process.env.DB_PASSWORD || ''
  });
  
  try {
    console.log('🔄 Starting database recreation...');
    
    // Get a client for transaction
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Drop existing tables in reverse order of dependencies
      console.log('1️⃣ Dropping existing tables...');
      await client.query('DROP TABLE IF EXISTS mqtt_messages CASCADE');
      await client.query('DROP TABLE IF EXISTS activity_logs CASCADE');
      await client.query('DROP TABLE IF EXISTS group_lockers CASCADE');
      await client.query('DROP TABLE IF EXISTS lockers CASCADE');
      await client.query('DROP TABLE IF EXISTS locker_groups CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      await client.query('DROP TABLE IF EXISTS settings CASCADE');
      
      // Create tables with new schema
      console.log('2️⃣ Creating tables with new schema...');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
      
      // Create lockers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS lockers (
          id SERIAL PRIMARY KEY,
          locker_id VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          status VARCHAR(50) DEFAULT 'available',
          ip_address INET,
          topic VARCHAR(255),
          num_locks INTEGER DEFAULT 1,
          api_token VARCHAR(255),
          controller_type VARCHAR(100),
          last_heartbeat TIMESTAMP,
          uptime INTEGER DEFAULT 0,
          is_online BOOLEAN DEFAULT false,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          last_used TIMESTAMP,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_lockers_locker_id ON lockers(locker_id);
        CREATE INDEX IF NOT EXISTS idx_lockers_status ON lockers(status);
      `);
      
      // Create groups table
      await client.query(`
        CREATE TABLE IF NOT EXISTS locker_groups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create group_lockers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS group_lockers (
          id SERIAL PRIMARY KEY,
          group_id INTEGER REFERENCES locker_groups(id) ON DELETE CASCADE,
          locker_id INTEGER REFERENCES lockers(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(group_id, locker_id)
        );
      `);
      
      // Create settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) UNIQUE NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create activity_logs table with CASCADE
      await client.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          locker_id INTEGER REFERENCES lockers(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          details JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);
        CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
      `);
      
      // Create mqtt_messages table with CASCADE
      await client.query(`
        CREATE TABLE IF NOT EXISTS mqtt_messages (
          id SERIAL PRIMARY KEY,
          topic VARCHAR(500) NOT NULL,
          payload JSONB,
          qos INTEGER DEFAULT 0,
          retain BOOLEAN DEFAULT false,
          locker_id INTEGER REFERENCES lockers(id) ON DELETE CASCADE,
          processed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_mqtt_topic ON mqtt_messages(topic);
        CREATE INDEX IF NOT EXISTS idx_mqtt_created ON mqtt_messages(created_at);
      `);
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('✅ Database recreation completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  }
}

// Run the recreation
recreateTables(); 