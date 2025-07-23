const mysql = require('mysql2/promise');

// Debug: Print DB environment variables
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'core-mariadb',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'your_user',
      password: process.env.DB_PASSWORD || 'your_password',
      database: process.env.DB_NAME || 'gym_lockers',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    this.isConnected = false;
  }

  async connect() {
    try {
      // Test connection
      const conn = await this.pool.getConnection();
      await conn.query('SELECT 1');
      conn.release();
      this.isConnected = true;
      console.log('\u2705 Database connected successfully');
      // Initialize schema
      await this.initializeSchema();
    } catch (error) {
      console.error('\u274c Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('\u2705 Database disconnected');
    }
  }

  async close() {
    await this.disconnect();
  }

  async initializeSchema() {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await this.createUsersTable(conn);
      await this.createLockersTable(conn);
      await this.createGroupsTable(conn);
      await this.createGroupLockersTable(conn);
      await this.createSettingsTable(conn);
      await this.createLogsTable(conn);
      await this.createMqttMessagesTable(conn);
      await conn.commit();
      console.log('\u2705 Database schema initialized');
    } catch (error) {
      await conn.rollback();
      console.error('\u274c Schema initialization failed:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  async createUsersTable(conn) {
    // First create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(createTableQuery);

    // Add missing columns if they don't exist
    const addColumnsQuery = `
      DO $$ 
      BEGIN 
        -- Add gym_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gym_id') THEN
          ALTER TABLE users ADD COLUMN gym_id VARCHAR(50);
        END IF;
        -- Add rfid_tag column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rfid_tag') THEN
          ALTER TABLE users ADD COLUMN rfid_tag VARCHAR(100);
        END IF;
        -- Add locker_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'locker_id') THEN
          ALTER TABLE users ADD COLUMN locker_id INTEGER REFERENCES lockers(id) ON DELETE SET NULL;
        END IF;
        -- Add valid_until column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'valid_until') THEN
          ALTER TABLE users ADD COLUMN valid_until TIMESTAMP;
        END IF;
      END $$;
    `;
    await conn.query(addColumnsQuery);

    // Add unique constraint on rfid_tag if it doesn't exist
    const addUniqueConstraintQuery = `
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'users_rfid_tag_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_rfid_tag_unique UNIQUE (rfid_tag);
        END IF;
      END $$;
    `;
    await conn.query(addUniqueConstraintQuery);

    // Drop NOT NULL constraints if they exist
    const dropConstraintsQuery = `
      DO $$ 
      BEGIN 
        -- Drop NOT NULL constraint on username if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'username' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
        END IF;
        
        -- Drop NOT NULL constraint on password_hash if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'password_hash' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        END IF;
      END $$;
    `;
    await conn.query(dropConstraintsQuery);

    // Create indexes if they don't exist
    const createIndexesQuery = `
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id);
      CREATE INDEX IF NOT EXISTS idx_users_rfid_tag ON users(rfid_tag);
    `;
    await conn.query(createIndexesQuery);
  }

  async createLockersTable(conn) {
    const query = `
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
    `;
    await conn.query(query);
  }

  async createGroupsTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS locker_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);
  }

  async createGroupLockersTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS group_lockers (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES locker_groups(id) ON DELETE CASCADE,
        locker_id INTEGER REFERENCES lockers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, locker_id)
      );
    `;
    await conn.query(query);
  }

  async createSettingsTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);
  }

  async createLogsTable(conn) {
    const query = `
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
    `;
    await conn.query(query);
  }

  async createMqttMessagesTable(conn) {
    const query = `
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
    `;
    await conn.query(query);
  }

  async query(sql, params = []) {
    const conn = await this.pool.getConnection();
    try {
      const result = await conn.query(sql, params);
      return result;
    } finally {
      conn.release();
    }
  }

  async transaction(callback) {
    const conn = await this.pool.getConnection();
    try {
      await conn.query('BEGIN');
      const result = await callback(conn);
      await conn.query('COMMIT');
      return result;
    } catch (error) {
      console.error('❌ Transaction error:', error);
      try {
      await conn.query('ROLLBACK');
        console.log('✅ Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError);
      }
      throw error;
    } finally {
      try {
      conn.release();
        console.log('✅ Client released');
      } catch (releaseError) {
        console.error('❌ Error releasing client:', releaseError);
      }
    }
  }

  // User methods
  async createUser(userData) {
    const { 
      username, 
      email, 
      password_hash, 
      role = 'user', 
      first_name, 
      last_name, 
      gym_id, 
      phone,
      rfid_tag,
      locker_id,
      valid_until 
    } = userData;
    
    const query = `
      INSERT INTO users (username, email, password_hash, role, first_name, last_name, gym_id, phone, rfid_tag, locker_id, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const result = await this.query(query, [
      username || null, 
      email, 
      password_hash || null, 
      role, 
      first_name, 
      last_name, 
      gym_id || null, 
      phone || null,
      rfid_tag || null,
      locker_id || null,
      valid_until || null
    ]);
    return result.rows[0];
  }

  async getAllUsers() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await this.query(query);
    return result.rows;
  }

  async updateUser(id, userData) {
    const fields = Object.keys(userData).map((key, index) => `${key} = ?`).join(', ');
    const values = Object.values(userData);
    const query = `
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? 
      RETURNING *
    `;
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = ? RETURNING *';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async getUserLogs(userId) {
    const query = `
      SELECT 
        al.*,
        l.name as locker_name,
        l.locker_id as locker_identifier
      FROM activity_logs al
      LEFT JOIN lockers l ON al.locker_id = l.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    const result = await this.query(query, [userId]);
    return result.rows;
  }

  async getUserByRfidTag(rfidTag) {
    const query = 'SELECT * FROM users WHERE rfid_tag = ?';
    const result = await this.query(query, [rfidTag]);
    return result.rows[0];
  }

  async isRfidTagAvailable(rfidTag, excludeUserId = null) {
    let query = 'SELECT id FROM users WHERE rfid_tag = ?';
    const params = [rfidTag];
    
    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }
    
    const result = await this.query(query, params);
    return result.rows.length === 0;
  }

  // Locker methods
  async createLocker(lockerData) {
    const { locker_id, name, location, status = 'available', ip_address, topic, num_locks = 1, api_token, controller_type, metadata = {} } = lockerData;
    const query = `
      INSERT INTO lockers (locker_id, name, location, status, ip_address, topic, num_locks, api_token, controller_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const result = await this.query(query, [locker_id, name, location, status, ip_address, topic, num_locks, api_token, controller_type, JSON.stringify(metadata)]);
    return result.rows[0];
  }

  async getAllLockers() {
    const query = 'SELECT * FROM lockers ORDER BY created_at DESC';
    const result = await this.query(query);
    return result.rows;
  }

  async getLockerByLockerId(lockerId) {
    const query = 'SELECT * FROM lockers WHERE locker_id = ?';
    const result = await this.query(query, [lockerId]);
    return result.rows[0];
  }

  async getLockerById(id) {
    const query = 'SELECT * FROM lockers WHERE id = ?';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async updateLocker(id, lockerData) {
    const fields = Object.keys(lockerData).map((key, index) => `${key} = ?`).join(', ');
    const values = Object.values(lockerData);
    const query = `
      UPDATE lockers 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? 
      RETURNING *
    `;
    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  async updateLockerHeartbeat(lockerId, heartbeatData) {
    const query = `
      UPDATE lockers 
      SET uptime = ?, ip_address = ?, last_heartbeat = CURRENT_TIMESTAMP, is_online = true, updated_at = CURRENT_TIMESTAMP 
      WHERE locker_id = ? 
      RETURNING *
    `;
    const result = await this.query(query, [lockerId, heartbeatData.uptime, heartbeatData.ip_address]);
    return result.rows[0];
  }

  async deleteLocker(id) {
    const query = 'DELETE FROM lockers WHERE id = ? RETURNING *';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Add getLockerGroup method
  async getLockerGroup(lockerId) {
    const query = `
      SELECT lg.* 
      FROM locker_groups lg
      JOIN group_lockers gl ON lg.id = gl.group_id
      WHERE gl.locker_id = ?
    `;
    const result = await this.query(query, [lockerId]);
    return result.rows[0] || null;
  }

  // Group methods
  async createGroup(groupData) {
    const { name, description, color = '#3B82F6', locker_ids = [] } = groupData;
    
    return await this.transaction(async (conn) => {
      // Create the group
      const groupQuery = `
        INSERT INTO locker_groups (name, description, color)
        VALUES (?, ?, ?)
        RETURNING *
      `;
      const groupResult = await conn.query(groupQuery, [name, description, color]);
      const group = groupResult.rows[0];
      
      // Add lockers to the group if provided
      if (locker_ids.length > 0) {
        const lockerQuery = `
          INSERT INTO group_lockers (group_id, locker_id)
          VALUES ${locker_ids.map((_, i) => `(?, ?)`).join(', ')}
        `;
        await conn.query(lockerQuery, [group.id, ...locker_ids]);
      }
      
      // Return group with locker_ids
      return { ...group, locker_ids };
    });
  }

  async getAllGroups() {
    const query = `
      SELECT 
        lg.*,
        COALESCE(
          json_agg(gl.locker_id) FILTER (WHERE gl.locker_id IS NOT NULL),
          '[]'::json
        ) as locker_ids
      FROM locker_groups lg
      LEFT JOIN group_lockers gl ON lg.id = gl.group_id
      GROUP BY lg.id
      ORDER BY lg.created_at DESC
    `;
    const result = await this.query(query);
    return result.rows;
  }

  async getGroupById(id) {
    const query = `
      SELECT 
        lg.*,
        COALESCE(
          json_agg(gl.locker_id) FILTER (WHERE gl.locker_id IS NOT NULL),
          '[]'::json
        ) as locker_ids
      FROM locker_groups lg
      LEFT JOIN group_lockers gl ON lg.id = gl.group_id
      WHERE lg.id = ?
      GROUP BY lg.id
    `;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async updateGroup(id, groupData) {
    const { name, description, color, locker_ids } = groupData;
    
    return await this.transaction(async (conn) => {
      // Update group info
      const fields = [];
      const values = [id];
      let paramIndex = 2;
      
      if (name !== undefined) {
        fields.push(`name = ?`);
        values.push(name);
      }
      if (description !== undefined) {
        fields.push(`description = ?`);
        values.push(description);
      }
      if (color !== undefined) {
        fields.push(`color = ?`);
        values.push(color);
      }
      
      const updateQuery = `
        UPDATE locker_groups 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? 
        RETURNING *
      `;
      const groupResult = await conn.query(updateQuery, values);
      const group = groupResult.rows[0];
      
      // Update locker associations if provided
      if (locker_ids !== undefined) {
        // Remove existing associations
        await conn.query('DELETE FROM group_lockers WHERE group_id = ?', [id]);
        
        // Add new associations
        if (locker_ids.length > 0) {
          const lockerQuery = `
            INSERT INTO group_lockers (group_id, locker_id)
            VALUES ${locker_ids.map((_, i) => `(?, ?)`).join(', ')}
          `;
          await conn.query(lockerQuery, [id, ...locker_ids]);
        }
      }
      
      return { ...group, locker_ids: locker_ids || [] };
    });
  }

  async deleteGroup(id) {
    const query = 'DELETE FROM locker_groups WHERE id = ? RETURNING *';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  // Settings methods
  async getAllSettings() {
    const query = 'SELECT * FROM settings ORDER BY key';
    const result = await this.query(query);
    return result.rows;
  }

  async setSetting(key, value, description = null) {
    const query = `
      INSERT INTO settings (key, value, description)
      VALUES (?, ?, ?)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await this.query(query, [key, JSON.stringify(value), description]);
    return result.rows[0];
  }

  async getSetting(key) {
    const query = 'SELECT * FROM settings WHERE key = ?';
    const result = await this.query(query, [key]);
    return result.rows[0];
  }

  // Activity logging
  async logActivity(activityData) {
    const { user_id, locker_id, action, details = {}, ip_address, user_agent } = activityData;
    
    // Convert empty string user_id to null
    let cleanUserId = user_id === '' || user_id === ' ' ? null : user_id;
    
    // If user_id is provided, check if user exists
    if (cleanUserId) {
      try {
        const userExists = await this.getUserById(cleanUserId);
        if (!userExists) {
          cleanUserId = null; // Set to null if user doesn't exist
        }
      } catch (error) {
        cleanUserId = null; // Set to null on error
      }
    }
    
    const query = `
      INSERT INTO activity_logs (user_id, locker_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
    const result = await this.query(query, [cleanUserId, locker_id, action, JSON.stringify(details), ip_address, user_agent]);
    return result.rows[0];
  }

  // MQTT message storage
  async saveMqttMessage(messageData) {
    const { topic, payload, qos = 0, retain = false, locker_id } = messageData;
    const query = `
      INSERT INTO mqtt_messages (topic, payload, qos, retain, locker_id)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `;
    const result = await this.query(query, [topic, JSON.stringify(payload), qos, retain, locker_id]);
    return result.rows[0];
  }
}

module.exports = Database;
