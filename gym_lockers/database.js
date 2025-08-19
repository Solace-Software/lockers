const mysql = require('mysql2/promise');
const config = require('./config');

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.name,
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
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await conn.query(createTableQuery);

    // Add missing columns if they don't exist (MariaDB compatible)
    const columnsToAdd = [
      { name: 'gym_id', type: 'VARCHAR(50)' },
      { name: 'rfid_tag', type: 'VARCHAR(100)' },
      { name: 'locker_id', type: 'INT' },
      { name: 'valid_until', type: 'TIMESTAMP NULL' }
    ];

    for (const column of columnsToAdd) {
      const checkColumnQuery = `
        SELECT COUNT(*) as count 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = '${column.name}'
      `;
      const [result] = await conn.query(checkColumnQuery);
      
      if (result[0].count === 0) {
        const addColumnQuery = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`;
        await conn.query(addColumnQuery);
        console.log(`Added column: ${column.name}`);
      }
    }

    // Add unique constraint on rfid_tag if it doesn't exist
    const checkConstraintQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_rfid_tag_unique'
    `;
    const [constraintResult] = await conn.query(checkConstraintQuery);
    
    if (constraintResult[0].count === 0) {
      const addUniqueConstraintQuery = `
        ALTER TABLE users ADD CONSTRAINT users_rfid_tag_unique UNIQUE (rfid_tag)
      `;
      await conn.query(addUniqueConstraintQuery);
              console.log('Added unique constraint on rfid_tag');
    }

    // Create indexes if they don't exist
    const indexesToCreate = [
      'idx_users_username ON users(username)',
      'idx_users_email ON users(email)',
      'idx_users_gym_id ON users(gym_id)',
      'idx_users_rfid_tag ON users(rfid_tag)'
    ];

    for (const index of indexesToCreate) {
      try {
        const createIndexQuery = `CREATE INDEX ${index}`;
        await conn.query(createIndexQuery);
        console.log(` Created index: ${index}`);
      } catch (error) {
        // Index might already exist, which is fine
        if (!error.message.includes('Duplicate key name')) {
          console.log(` Index creation skipped: ${index}`);
        }
      }
    }
  }

  async createLockersTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS lockers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        locker_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'available',
        ip_address VARCHAR(45),
        topic VARCHAR(255),
        num_locks INT DEFAULT 1,
        api_token VARCHAR(255),
        controller_type VARCHAR(100),
        last_heartbeat TIMESTAMP NULL,
        uptime INT DEFAULT 0,
        is_online BOOLEAN DEFAULT false,
        user_id INT,
        last_used TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);

    // Create indexes
    const indexesToCreate = [
      'idx_lockers_locker_id ON lockers(locker_id)',
      'idx_lockers_status ON lockers(status)'
    ];

    for (const index of indexesToCreate) {
      try {
        const createIndexQuery = `CREATE INDEX ${index}`;
        await conn.query(createIndexQuery);
        console.log(` Created index: ${index}`);
      } catch (error) {
        // Index might already exist, which is fine
        if (!error.message.includes('Duplicate key name')) {
          console.log(` Index creation skipped: ${index}`);
        }
      }
    }
  }

  async createGroupsTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS locker_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);
  }

  async createGroupLockersTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS group_lockers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT,
        locker_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_group_locker (group_id, locker_id)
      );
    `;
    await conn.query(query);
  }

  async createSettingsTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(255) UNIQUE NOT NULL,
        value JSON,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);
  }

  async createLogsTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        locker_id INT,
        action VARCHAR(100) NOT NULL,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);

    // Create indexes
    const indexesToCreate = [
      'idx_logs_action ON activity_logs(action)',
      'idx_logs_created ON activity_logs(created_at)'
    ];

    for (const index of indexesToCreate) {
      try {
        const createIndexQuery = `CREATE INDEX ${index}`;
        await conn.query(createIndexQuery);
        console.log(` Created index: ${index}`);
      } catch (error) {
        // Index might already exist, which is fine
        if (!error.message.includes('Duplicate key name')) {
          console.log(` Index creation skipped: ${index}`);
        }
      }
    }
  }

  async createMqttMessagesTable(conn) {
    const query = `
      CREATE TABLE IF NOT EXISTS mqtt_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic VARCHAR(500) NOT NULL,
        payload JSON,
        qos INT DEFAULT 0,
        retain BOOLEAN DEFAULT false,
        locker_id INT,
        processed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(query);

    // Create indexes
    const indexesToCreate = [
      'idx_mqtt_topic ON mqtt_messages(topic)',
      'idx_mqtt_created ON mqtt_messages(created_at)'
    ];

    for (const index of indexesToCreate) {
      try {
        const createIndexQuery = `CREATE INDEX ${index}`;
        await conn.query(createIndexQuery);
        console.log(` Created index: ${index}`);
      } catch (error) {
        // Index might already exist, which is fine
        if (!error.message.includes('Duplicate key name')) {
          console.log(` Index creation skipped: ${index}`);
        }
      }
    }
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
        console.log(' Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError);
      }
      throw error;
    } finally {
      try {
      conn.release();
        console.log(' Client released');
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
    
    // Get the inserted user
    const userId = result[0].insertId;
    return await this.getUserById(userId);
  }

  async getAllUsers() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await this.query(query);
    return result[0];
  }

  async updateUser(id, userData) {
    const fields = Object.keys(userData).map((key, index) => `${key} = ?`).join(', ');
    const values = Object.values(userData);
    const query = `
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await this.query(query, [...values, id]);
    return await this.getUserById(id);
  }

  async deleteUser(id) {
    const user = await this.getUserById(id);
    const query = 'DELETE FROM users WHERE id = ?';
    await this.query(query, [id]);
    return user;
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await this.query(query, [id]);
    return result[0][0];
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
    return result[0];
  }

  async getUserByRfidTag(rfidTag) {
    const query = 'SELECT * FROM users WHERE rfid_tag = ?';
    const result = await this.query(query, [rfidTag]);
    return result[0][0];
  }

  async isRfidTagAvailable(rfidTag, excludeUserId = null) {
    let query = 'SELECT id FROM users WHERE rfid_tag = ?';
    const params = [rfidTag];
    
    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }
    
    const result = await this.query(query, params);
    return result[0].length === 0;
  }

  // Locker methods
  async createLocker(lockerData) {
    const { locker_id, name, location, status = 'available', ip_address, topic, num_locks = 1, api_token, controller_type, metadata = {} } = lockerData;
    const query = `
      INSERT INTO lockers (locker_id, name, location, status, ip_address, topic, num_locks, api_token, controller_type, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await this.query(query, [locker_id, name, location, status, ip_address, topic, num_locks, api_token, controller_type, JSON.stringify(metadata)]);
    
    // Get the inserted locker
    const lockerId = result[0].insertId;
    return await this.getLockerById(lockerId);
  }

  async getAllLockers() {
    const query = 'SELECT * FROM lockers ORDER BY created_at DESC';
    const result = await this.query(query);
    return result[0];
  }

  async getLockerByLockerId(lockerId) {
    const query = 'SELECT * FROM lockers WHERE locker_id = ?';
    const result = await this.query(query, [lockerId]);
    return result[0][0];
  }

  async getLockerById(id) {
    const query = 'SELECT * FROM lockers WHERE id = ?';
    const result = await this.query(query, [id]);
    return result[0][0];
  }

  async updateLocker(id, lockerData) {
    const fields = Object.keys(lockerData).map((key, index) => `${key} = ?`).join(', ');
    const values = Object.values(lockerData);
    const query = `
      UPDATE lockers 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    await this.query(query, [...values, id]);
    return await this.getLockerById(id);
  }

  async updateLockerHeartbeat(lockerId, heartbeatData) {
    const query = `
      UPDATE lockers 
      SET uptime = ?, ip_address = ?, last_heartbeat = CURRENT_TIMESTAMP, is_online = true, updated_at = CURRENT_TIMESTAMP 
      WHERE locker_id = ?
    `;
    await this.query(query, [heartbeatData.uptime, heartbeatData.ip_address, lockerId]);
    return await this.getLockerByLockerId(lockerId);
  }

  async deleteLocker(id) {
    const locker = await this.getLockerById(id);
    const query = 'DELETE FROM lockers WHERE id = ?';
    await this.query(query, [id]);
    return locker;
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
    return result[0][0] || null;
  }

  // Group methods
  async createGroup(groupData) {
    const { name, description, color = '#3B82F6', locker_ids = [] } = groupData;
    
    return await this.transaction(async (conn) => {
      // Create the group
      const groupQuery = `
        INSERT INTO locker_groups (name, description, color)
        VALUES (?, ?, ?)
      `;
      const groupResult = await conn.query(groupQuery, [name, description, color]);
      const groupId = groupResult[0].insertId;
      
      // Add lockers to the group if provided
      if (locker_ids.length > 0) {
        const lockerQuery = `
          INSERT INTO group_lockers (group_id, locker_id)
          VALUES ${locker_ids.map((_, i) => `(?, ?)`).join(', ')}
        `;
        const lockerValues = locker_ids.flatMap(lockerId => [groupId, lockerId]);
        await conn.query(lockerQuery, lockerValues);
      }
      
      // Return the created group data directly (instead of calling getGroupById which may fail in transaction)
      const createdGroup = {
        id: groupId,
        name,
        description,
        color,
        locker_ids: locker_ids.length > 0 ? locker_ids : [],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      return createdGroup;
    });
  }

  async getAllGroups() {
    const query = `
      SELECT 
        lg.*,
        JSON_ARRAYAGG(gl.locker_id) as locker_ids
      FROM locker_groups lg
      LEFT JOIN group_lockers gl ON lg.id = gl.group_id
      GROUP BY lg.id
      ORDER BY lg.created_at DESC
    `;
    const result = await this.query(query);
    
    // Process results to ensure locker_ids is always a proper array
    const groups = result[0].map(group => ({
      ...group,
      locker_ids: this.processLockerIds(group.locker_ids)
    }));
    
    return groups;
  }

  // Helper method to process locker_ids from JSON_ARRAYAGG
  processLockerIds(lockerIds) {
    if (!lockerIds) return [];
    
    // If it's already an array, filter out null values
    if (Array.isArray(lockerIds)) {
      return lockerIds.filter(id => id !== null);
    }
    
    // If it's a string, parse it and filter out null values
    try {
      const parsed = JSON.parse(lockerIds);
      return Array.isArray(parsed) ? parsed.filter(id => id !== null) : [];
    } catch (error) {
      console.error('Error parsing locker_ids:', error);
      return [];
    }
  }

  async getGroupById(id) {
    const query = `
      SELECT 
        lg.*,
        JSON_ARRAYAGG(gl.locker_id) as locker_ids
      FROM locker_groups lg
      LEFT JOIN group_lockers gl ON lg.id = gl.group_id
      WHERE lg.id = ?
      GROUP BY lg.id
    `;
    const result = await this.query(query, [id]);
    const group = result[0][0];
    
    if (!group) return null;
    
    return {
      ...group,
      locker_ids: this.processLockerIds(group.locker_ids)
    };
  }

  async updateGroup(id, groupData) {
    const { name, description, color, locker_ids } = groupData;
    
    return await this.transaction(async (conn) => {
      // Update group info
      const fields = [];
      const values = [];
      
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
      
      if (fields.length > 0) {
        const updateQuery = `
          UPDATE locker_groups 
          SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        await conn.query(updateQuery, [...values, id]);
      }
      
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
      
      return await this.getGroupById(id);
    });
  }

  async deleteGroup(id) {
    const group = await this.getGroupById(id);
    const query = 'DELETE FROM locker_groups WHERE id = ?';
    await this.query(query, [id]);
    return group;
  }

  // Settings methods
  async getAllSettings() {
    const query = 'SELECT * FROM settings ORDER BY `key`';
    const result = await this.query(query);
    return result[0];
  }

  async setSetting(key, value, description = null) {
    const query = `
      INSERT INTO settings (\`key\`, value, description)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        description = VALUES(description),
        updated_at = CURRENT_TIMESTAMP
    `;
    await this.query(query, [key, JSON.stringify(value), description]);
    return await this.getSetting(key);
  }

  async getSetting(key) {
    const query = 'SELECT * FROM settings WHERE `key` = ?';
    const result = await this.query(query, [key]);
    return result[0][0];
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
    `;
    const result = await this.query(query, [cleanUserId, locker_id, action, JSON.stringify(details), ip_address, user_agent]);
    return { id: result[0].insertId };
  }

  // MQTT message storage
  async saveMqttMessage(messageData) {
    const { topic, payload, qos = 0, retain = false, locker_id } = messageData;
    const query = `
      INSERT INTO mqtt_messages (topic, payload, qos, retain, locker_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await this.query(query, [topic, JSON.stringify(payload), qos, retain, locker_id]);
    return { id: result[0].insertId };
  }
}

module.exports = Database;
