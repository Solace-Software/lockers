const fs = require('fs');
const path = require('path');
const { Pool: PgPool } = require('pg');
const mysql = require('mysql2/promise');
const mqtt = require('mqtt');
const mosca = require('mosca');

class ConfigManager {
  constructor() {
    this.configSchema = require('./config-schema.json');
    this.config = null;
    this.builtInBroker = null;
    this.externalMqttClient = null;
    this.dbPool = null;
  }

  async loadConfig() {
    try {
      // Try to load from environment variables first
      this.config = this.loadFromEnv();

      // If no environment variables, try loading from config file
      if (!this.config) {
        const configPath = path.join(__dirname, 'config.json');
        if (fs.existsSync(configPath)) {
          this.config = require(configPath);
        }
      }

      // If still no config, use defaults from schema
      if (!this.config) {
        this.config = this.getDefaultConfig();
      }

      // Validate the config
      this.validateConfig();

      // Initialize database connection
      await this.initializeDatabase();

      // Initialize MQTT based on mode
      await this.initializeMqtt();

      return this.config;
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
      throw error;
    }
  }

  loadFromEnv() {
    // Check if we have any environment variables set
    const hasEnvConfig = process.env.DB_TYPE || process.env.MQTT_MODE;
    if (!hasEnvConfig) return null;

    return {
      database: {
        type: process.env.DB_TYPE || 'mariadb',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || (process.env.DB_TYPE === 'postgresql' ? 5432 : 3306),
        name: process.env.DB_NAME || 'gym_lockers',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max_connections: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
        idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
      },
      mqtt: {
        mode: process.env.MQTT_MODE || 'built-in',
        built_in: {
          enabled: process.env.MQTT_BUILTIN_ENABLED !== 'false',
          port: parseInt(process.env.MQTT_BUILTIN_PORT) || 1883,
          persistence: process.env.MQTT_BUILTIN_PERSISTENCE !== 'false'
        },
        external: {
          host: process.env.MQTT_EXTERNAL_HOST,
          port: parseInt(process.env.MQTT_EXTERNAL_PORT) || 1883,
          username: process.env.MQTT_EXTERNAL_USERNAME,
          password: process.env.MQTT_EXTERNAL_PASSWORD,
          client_id: process.env.MQTT_EXTERNAL_CLIENT_ID
        }
      },
      system: {
        auto_refresh: parseInt(process.env.AUTO_REFRESH) || 30,
        data_retention_days: parseInt(process.env.DATA_RETENTION_DAYS) || 90,
        backup_enabled: process.env.BACKUP_ENABLED !== 'false',
        debug_mode: process.env.DEBUG_MODE === 'true'
      }
    };
  }

  getDefaultConfig() {
    const defaultConfig = {};
    
    // Helper function to get default values from schema
    const getDefaults = (schema) => {
      const defaults = {};
      for (const [key, value] of Object.entries(schema)) {
        if (value.type === 'object') {
          defaults[key] = getDefaults(value.properties);
        } else if ('default' in value) {
          defaults[key] = value.default;
        }
      }
      return defaults;
    };

    // Get defaults from schema
    return getDefaults(this.configSchema);
  }

  validateConfig() {
    // Helper function to validate against schema
    const validate = (config, schema) => {
      for (const [key, value] of Object.entries(schema)) {
        if (value.type === 'object') {
          if (!config[key] || typeof config[key] !== 'object') {
            throw new Error(`Invalid configuration: ${key} must be an object`);
          }
          validate(config[key], value.properties);
        } else {
          if (value.required && !(key in config)) {
            throw new Error(`Missing required configuration: ${key}`);
          }
          if (value.enum && config[key] && !value.enum.includes(config[key])) {
            throw new Error(`Invalid value for ${key}: must be one of ${value.enum.join(', ')}`);
          }
        }
      }
    };

    validate(this.config, this.configSchema);
  }

  async initializeDatabase() {
    if (this.dbPool) {
      await this.dbPool.end();
    }

    const dbConfig = this.config.database;

    if (dbConfig.type === 'postgresql') {
      this.dbPool = new PgPool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.name,
        user: dbConfig.user,
        password: dbConfig.password,
        max: dbConfig.max_connections,
        idleTimeoutMillis: dbConfig.idle_timeout
      });
    } else {
      // MariaDB/MySQL
      this.dbPool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.name,
        user: dbConfig.user,
        password: dbConfig.password,
        connectionLimit: dbConfig.max_connections,
        waitForConnections: true,
        queueLimit: 0
      });
    }

    // Test connection
    try {
      if (dbConfig.type === 'postgresql') {
        await this.dbPool.query('SELECT NOW()');
      } else {
        await this.dbPool.query('SELECT 1');
      }
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async initializeMqtt() {
    const mqttConfig = this.config.mqtt;

    if (mqttConfig.mode === 'built-in' && mqttConfig.built_in.enabled) {
      // Set up built-in MQTT broker
      const moscaSettings = {
        port: mqttConfig.built_in.port,
        persistence: mqttConfig.built_in.persistence ? {
          factory: mosca.persistence.Memory
        } : false
      };

      this.builtInBroker = new mosca.Server(moscaSettings);

      this.builtInBroker.on('ready', () => {
        console.log('✅ Built-in MQTT broker is ready');
      });

      this.builtInBroker.on('error', (err) => {
        console.error('❌ Built-in MQTT broker error:', err);
      });
    } else if (mqttConfig.mode === 'external') {
      // Connect to external MQTT broker
      const { host, port, username, password, client_id } = mqttConfig.external;
      const brokerUrl = `mqtt://${host}:${port}`;
      
      this.externalMqttClient = mqtt.connect(brokerUrl, {
        clientId: client_id,
        username: username,
        password: password,
        clean: true,
        reconnectPeriod: 5000
      });

      this.externalMqttClient.on('connect', () => {
        console.log('✅ Connected to external MQTT broker');
      });

      this.externalMqttClient.on('error', (err) => {
        console.error('❌ External MQTT broker error:', err);
      });
    }
  }

  async updateConfig(newConfig) {
    // Validate new configuration
    const oldConfig = this.config;
    this.config = { ...this.config, ...newConfig };
    
    try {
      this.validateConfig();
      
      // Apply changes
      if (JSON.stringify(oldConfig.database) !== JSON.stringify(this.config.database)) {
        await this.initializeDatabase();
      }
      
      if (JSON.stringify(oldConfig.mqtt) !== JSON.stringify(this.config.mqtt)) {
        await this.initializeMqtt();
      }
      
      // Save to file
      await fs.promises.writeFile(
        path.join(__dirname, 'config.json'),
        JSON.stringify(this.config, null, 2)
      );
      
      return this.config;
    } catch (error) {
      // Rollback on error
      this.config = oldConfig;
      throw error;
    }
  }

  getConfig() {
    return this.config;
  }

  getDatabasePool() {
    return this.dbPool;
  }

  getMqttClient() {
    return this.config.mqtt.mode === 'built-in' ? this.builtInBroker : this.externalMqttClient;
  }
}

module.exports = new ConfigManager();