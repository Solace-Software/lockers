const fs = require('fs');
const path = require('path');

// Function to get addon configuration
function getAddonConfig() {
  try {
    // Try to read from Home Assistant addon configuration
    const configPath = '/data/options.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('📋 Loaded configuration from addon options');
      return config;
    }
  } catch (error) {
    console.log('⚠️ Could not read addon configuration:', error.message);
  }
  
  try {
    // Try to read from Docker-specific config file (for Docker environment)
    const dockerConfigPath = path.join(__dirname, 'docker-config.json');
    if (fs.existsSync(dockerConfigPath)) {
      const config = JSON.parse(fs.readFileSync(dockerConfigPath, 'utf8'));
      console.log('📋 Loaded configuration from Docker config file');
      return config;
    }
  } catch (error) {
    console.log('⚠️ Could not read Docker config file:', error.message);
  }

  try {
    // Try to read from HA-specific config file (for Home Assistant environment)
    const haConfigPath = path.join(__dirname, 'ha-config.json');
    if (fs.existsSync(haConfigPath)) {
      const config = JSON.parse(fs.readFileSync(haConfigPath, 'utf8'));
      console.log('📋 Loaded configuration from HA config file');
      return config;
    }
  } catch (error) {
    console.log('⚠️ Could not read HA config file:', error.message);
  }
  
  try {
    // Try to read from local config file (for development)
    const localConfigPath = path.join(__dirname, 'local-config.json');
    if (fs.existsSync(localConfigPath)) {
      const config = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
      console.log('📋 Loaded configuration from local config file');
      return config;
    }
  } catch (error) {
    console.log('⚠️ Could not read local config file:', error.message);
  }
  
  // Fallback to environment variables
  const config = {
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_user: process.env.DB_USER,
    db_password: process.env.DB_PASSWORD,
    db_name: process.env.DB_NAME,
    mqtt_host: process.env.MQTT_HOST,
    mqtt_port: process.env.MQTT_PORT,
    mqtt_username: process.env.MQTT_USERNAME,
    mqtt_password: process.env.MQTT_PASSWORD,
    mqtt_client_id: process.env.MQTT_CLIENT_ID
  };
  
  console.log('📋 Using environment variables for configuration');
  return config;
}

// Get configuration
const addonConfig = getAddonConfig();

// Database configuration
const dbConfig = {
  host: addonConfig.db_host || 'core-mariadb',
  port: addonConfig.db_port ? parseInt(addonConfig.db_port) : 3306,
  user: addonConfig.db_user || 'your_user',
  password: addonConfig.db_password || 'your_password',
  database: addonConfig.db_name || 'gym_lockers'
};

// MQTT configuration
const mqttConfig = {
  host: addonConfig.mqtt_host || 'core-mosquitto',
  port: addonConfig.mqtt_port ? parseInt(addonConfig.mqtt_port) : 1883,
  username: addonConfig.mqtt_username || undefined,
  password: addonConfig.mqtt_password || undefined,
  clientId: addonConfig.mqtt_client_id || `gym-admin-${Math.random().toString(16).slice(3)}`
};

// Debug: Print configurations
console.log('DB_HOST:', dbConfig.host);
console.log('DB_PORT:', dbConfig.port);
console.log('DB_USER:', dbConfig.user);
console.log('DB_PASSWORD:', dbConfig.password ? '***' : 'undefined');
console.log('DB_NAME:', dbConfig.database);

console.log('MQTT_HOST:', mqttConfig.host);
console.log('MQTT_PORT:', mqttConfig.port);
console.log('MQTT_USERNAME:', mqttConfig.username || 'undefined');
console.log('MQTT_PASSWORD:', mqttConfig.password ? '***' : 'undefined');
console.log('MQTT_CLIENT_ID:', mqttConfig.clientId);

module.exports = {
  dbConfig,
  mqttConfig,
  addonConfig
}; 