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
  
  // No hardcoded credential files - only use addon configuration or environment variables
  
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
  user: addonConfig.db_user || '',
  password: addonConfig.db_password || '',
  database: addonConfig.db_name || 'gym_lockers'
};

// MQTT configuration
const mqttConfig = {
  host: addonConfig.mqtt_host || 'core-mosquitto',
  port: addonConfig.mqtt_port ? parseInt(addonConfig.mqtt_port) : 1883,
  username: addonConfig.mqtt_username || undefined,
  password: addonConfig.mqtt_password || undefined,
  clientId: addonConfig.mqtt_client_id || `gym-admin-${Math.random().toString(16).slice(3)}`,
  websocketPort: addonConfig.mqtt_websocket_port ? parseInt(addonConfig.mqtt_websocket_port) : 9001,
  allowAnonymous: addonConfig.mqtt_allow_anonymous !== undefined ? addonConfig.mqtt_allow_anonymous : true,
  maxConnections: addonConfig.mqtt_max_connections ? parseInt(addonConfig.mqtt_max_connections) : 100,
  maxMessageSize: addonConfig.mqtt_max_message_size ? parseInt(addonConfig.mqtt_max_message_size) : 1024
};

// System settings
const systemSettings = {
  autoRefresh: addonConfig.system_auto_refresh ? parseInt(addonConfig.system_auto_refresh) : 30,
  dataRetention: addonConfig.system_data_retention_days ? parseInt(addonConfig.system_data_retention_days) : 90,
  backupEnabled: addonConfig.system_backup_enabled !== undefined ? addonConfig.system_backup_enabled : true,
  debugMode: addonConfig.system_debug_mode !== undefined ? addonConfig.system_debug_mode : false
};

// Notification settings
const notificationSettings = {
  emailAlerts: addonConfig.notifications_email_alerts !== undefined ? addonConfig.notifications_email_alerts : true,
  usageReports: addonConfig.notifications_usage_reports !== undefined ? addonConfig.notifications_usage_reports : false,
  realTimeUpdates: addonConfig.notifications_real_time_updates !== undefined ? addonConfig.notifications_real_time_updates : true
};

// Security settings
const securitySettings = {
  sessionTimeout: addonConfig.security_session_timeout ? parseInt(addonConfig.security_session_timeout) : 30,
  passwordPolicy: addonConfig.security_password_policy || 'standard',
  twoFactorAuth: addonConfig.security_two_factor_auth !== undefined ? addonConfig.security_two_factor_auth : false,
  auditLogging: addonConfig.security_audit_logging !== undefined ? addonConfig.security_audit_logging : true
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
console.log('MQTT_WEBSOCKET_PORT:', mqttConfig.websocketPort);
console.log('MQTT_ALLOW_ANONYMOUS:', mqttConfig.allowAnonymous);
console.log('MQTT_MAX_CONNECTIONS:', mqttConfig.maxConnections);
console.log('MQTT_MAX_MESSAGE_SIZE:', mqttConfig.maxMessageSize);

console.log('SYSTEM_AUTO_REFRESH:', systemSettings.autoRefresh);
console.log('SYSTEM_DATA_RETENTION:', systemSettings.dataRetention);
console.log('SYSTEM_BACKUP_ENABLED:', systemSettings.backupEnabled);
console.log('SYSTEM_DEBUG_MODE:', systemSettings.debugMode);

console.log('NOTIFICATIONS_EMAIL_ALERTS:', notificationSettings.emailAlerts);
console.log('NOTIFICATIONS_USAGE_REPORTS:', notificationSettings.usageReports);
console.log('NOTIFICATIONS_REAL_TIME_UPDATES:', notificationSettings.realTimeUpdates);

console.log('SECURITY_SESSION_TIMEOUT:', securitySettings.sessionTimeout);
console.log('SECURITY_PASSWORD_POLICY:', securitySettings.passwordPolicy);
console.log('SECURITY_TWO_FACTOR_AUTH:', securitySettings.twoFactorAuth);
console.log('SECURITY_AUDIT_LOGGING:', securitySettings.auditLogging);

module.exports = {
  dbConfig,
  mqttConfig,
  systemSettings,
  notificationSettings,
  securitySettings,
  addonConfig
}; 