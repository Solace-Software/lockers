const express = require('express');

function createSettingsRouter(db) {
  const router = express.Router();

  // Get current configuration
  router.get('/config', (req, res) => {
    try {
      const storageInfo = {
        type: 'memory',
        status: 'active',
        isTemporary: true,
        details: {
          reason: 'Using in-memory storage'
        }
      };

      const config = {
        database: {
          type: process.env.DB_TYPE || 'mariadb',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 3306,
          name: process.env.DB_NAME || 'gym_lockers',
          user: process.env.DB_USER || 'root',
          password: '',
          max_connections: 20,
          idle_timeout: 30000,
          status: storageInfo
        },
        mqtt: {
          mode: process.env.MQTT_MODE || 'built-in',
          built_in: {
            enabled: process.env.MQTT_BUILTIN_ENABLED !== 'false',
            port: parseInt(process.env.MQTT_BUILTIN_PORT) || 1883,
            persistence: true
          },
          external: {
            host: process.env.MQTT_EXTERNAL_HOST || 'localhost',
            port: parseInt(process.env.MQTT_EXTERNAL_PORT) || 1883,
            username: process.env.MQTT_EXTERNAL_USERNAME || '',
            password: process.env.MQTT_EXTERNAL_PASSWORD || '',
            client_id: process.env.MQTT_EXTERNAL_CLIENT_ID || 'gym_lockers_client'
          }
        },
        system: {
          auto_refresh: parseInt(process.env.AUTO_REFRESH) || 30,
          data_retention_days: parseInt(process.env.DATA_RETENTION_DAYS) || 90,
          backup_enabled: process.env.BACKUP_ENABLED !== 'false',
          debug_mode: process.env.DEBUG_MODE === 'true'
        }
      };
      
      res.json(config);
    } catch (error) {
      console.error('❌ Error getting configuration:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  });

  // Update configuration
  router.post('/config', async (req, res) => {
    try {
      const newConfig = req.body;
      
      // Update environment variables
      process.env.DB_TYPE = newConfig.database.type;
      process.env.DB_HOST = newConfig.database.host;
      process.env.DB_PORT = newConfig.database.port.toString();
      process.env.DB_NAME = newConfig.database.name;
      process.env.DB_USER = newConfig.database.user;
      if (newConfig.database.password) {
        process.env.DB_PASSWORD = newConfig.database.password;
      }
      
      process.env.MQTT_MODE = newConfig.mqtt.mode;
      process.env.MQTT_BUILTIN_ENABLED = newConfig.mqtt.built_in.enabled.toString();
      process.env.MQTT_BUILTIN_PORT = newConfig.mqtt.built_in.port.toString();
      
      if (newConfig.mqtt.mode === 'external') {
        process.env.MQTT_EXTERNAL_HOST = newConfig.mqtt.external.host;
        process.env.MQTT_EXTERNAL_PORT = newConfig.mqtt.external.port.toString();
        process.env.MQTT_EXTERNAL_USERNAME = newConfig.mqtt.external.username;
        if (newConfig.mqtt.external.password) {
          process.env.MQTT_EXTERNAL_PASSWORD = newConfig.mqtt.external.password;
        }
        process.env.MQTT_EXTERNAL_CLIENT_ID = newConfig.mqtt.external.client_id;
      }
      
      process.env.AUTO_REFRESH = newConfig.system.auto_refresh.toString();
      process.env.DATA_RETENTION_DAYS = newConfig.system.data_retention_days.toString();
      process.env.BACKUP_ENABLED = newConfig.system.backup_enabled.toString();
      process.env.DEBUG_MODE = newConfig.system.debug_mode.toString();
      
      res.json({ success: true, message: 'Configuration updated successfully' });
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  // Test database connection
  router.post('/test-database', async (req, res) => {
    try {
      return res.json({ 
        success: true, 
        message: 'Using in-memory storage, no database connection required' 
      });
    } catch (error) {
      console.error('❌ Error testing database connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Database connection failed',
        details: error.message
      });
    }
  });

  // Test MQTT connection
  router.post('/test-mqtt', async (req, res) => {
    try {
      const mqtt = require('mqtt');
      
      const config = {
        host: process.env.MQTT_MODE === 'external' ? 
          process.env.MQTT_EXTERNAL_HOST : 'localhost',
        port: process.env.MQTT_MODE === 'external' ? 
          parseInt(process.env.MQTT_EXTERNAL_PORT) : parseInt(process.env.MQTT_BUILTIN_PORT),
        username: process.env.MQTT_EXTERNAL_USERNAME,
        password: process.env.MQTT_EXTERNAL_PASSWORD,
        clientId: `test-${Math.random().toString(16).slice(3)}`
      };
      
      const client = mqtt.connect(`mqtt://${config.host}:${config.port}`, {
        clientId: config.clientId,
        username: config.username,
        password: config.password,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000
      });
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.end();
          reject(new Error('Connection timeout'));
        }, 5000);
        
        client.once('connect', () => {
          clearTimeout(timeout);
          
          // Send a test message
          const testMessage = {
            type: 'test',
            timestamp: new Date().toISOString(),
            message: 'MQTT connection test successful',
            clientId: config.clientId
          };
          
          client.publish('test/connection', JSON.stringify(testMessage), (err) => {
            if (err) {
              client.end();
              reject(new Error('Failed to send test message: ' + err.message));
            } else {
              console.log('✅ Test message sent successfully');
              client.end();
              resolve();
            }
          });
        });
        
        client.once('error', (err) => {
          clearTimeout(timeout);
          client.end();
          reject(err);
        });
      });
      
      res.json({ success: true, message: 'MQTT connection and message test successful' });
    } catch (error) {
      console.error('❌ Error testing MQTT connection:', error);
      res.status(500).json({ 
        success: false, 
        error: 'MQTT connection failed',
        details: error.message
      });
    }
  });

  return router;
}

module.exports = createSettingsRouter;