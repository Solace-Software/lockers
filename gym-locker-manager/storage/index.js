const Database = require('../database');
const MemoryStore = require('./memory-store');

class StorageFactory {
  static async createStorage() {
    // Check if database is enabled in environment
    const useDatabase = process.env.USE_DATABASE === 'true';
    let storageInfo = {
      type: 'unknown',
      status: 'initializing',
      isTemporary: false,
      details: null
    };

    if (useDatabase) {
      try {
        const db = new Database();
        await db.connect();
        storageInfo = {
          type: 'postgresql',
          status: 'connected',
          isTemporary: false,
          details: {
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'gym_lockers'
          }
        };
        console.log('Connected to PostgreSQL database successfully');
        db.getStorageInfo = () => storageInfo;
        return db;
      } catch (error) {
        console.warn('Warning: Failed to connect to database:', error.message);
        console.log('Warning: Falling back to in-memory storage');
        storageInfo = {
          type: 'memory',
          status: 'active',
          isTemporary: true,
          details: {
            reason: 'Database connection failed: ' + error.message
          }
        };
        const memStore = new MemoryStore();
        memStore.getStorageInfo = () => storageInfo;
        return memStore;
      }
    } else {
      console.log('Info: Database disabled, using in-memory storage');
      storageInfo = {
        type: 'memory',
        status: 'active',
        isTemporary: true,
        details: {
          reason: 'Database disabled by configuration'
        }
      };
      const memStore = new MemoryStore();
      memStore.getStorageInfo = () => storageInfo;
      return memStore;
    }
  }
}

module.exports = StorageFactory;