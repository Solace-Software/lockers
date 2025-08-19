const fs = require('fs');
const path = require('path');

// Try to load Home Assistant add-on configuration first
function loadAddonConfig() {
    try {
        const addonConfigPath = '/data/options.json';
        if (fs.existsSync(addonConfigPath)) {
            const config = JSON.parse(fs.readFileSync(addonConfigPath, 'utf8'));
            console.log('Loaded configuration from addon options');
            return config;
        }
    } catch (error) {
        console.log('Could not read addon configuration:', error.message);
    }
    return null;
}

// Try to load local configuration file
function loadLocalConfig() {
    try {
        const localConfigPath = path.join(__dirname, 'local-config.json');
        if (fs.existsSync(localConfigPath)) {
            const config = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
            console.log('Loaded configuration from local config file');
            return config;
        }
    } catch (error) {
        console.log('Could not read local config file:', error.message);
    }
    return null;
}

// Load environment variables
function loadEnvConfig() {
    const config = {};
    
    // Database configuration
    if (process.env.DB_HOST) config.database = { ...config.database, host: process.env.DB_HOST };
    if (process.env.DB_PORT) config.database = { ...config.database, port: parseInt(process.env.DB_PORT) };
    if (process.env.DB_NAME) config.database = { ...config.database, name: process.env.DB_NAME };
    if (process.env.DB_USER) config.database = { ...config.database, username: process.env.DB_USER };
    if (process.env.DB_PASSWORD) config.database = { ...config.database, password: process.env.DB_PASSWORD };
    
    // MQTT configuration
    if (process.env.MQTT_HOST) config.mqtt = { ...config.mqtt, external: { ...config.mqtt?.external, host: process.env.MQTT_HOST } };
    if (process.env.MQTT_PORT) config.mqtt = { ...config.mqtt, external: { ...config.mqtt?.external, port: parseInt(process.env.MQTT_PORT) } };
    if (process.env.MQTT_USERNAME) config.mqtt = { ...config.mqtt, external: { ...config.mqtt?.external, username: process.env.MQTT_USERNAME } };
    if (process.env.MQTT_PASSWORD) config.mqtt = { ...config.mqtt, external: { ...config.mQTT?.external, password: process.env.MQTT_PASSWORD } };
    
    // System configuration
    if (process.env.AUTO_REFRESH) config.system = { ...config.system, auto_refresh: parseInt(process.env.AUTO_REFRESH) };
    if (process.env.DATA_RETENTION) config.system = { ...config.system, data_retention: parseInt(process.env.DATA_RETENTION) };
    if (process.env.DEBUG_MODE) config.system = { ...config.system, debug_mode: process.env.DEBUG_MODE === 'true' };
    
    if (Object.keys(config).length > 0) {
        console.log('Using environment variables for configuration');
    }
    
    return config;
}

// Merge configurations with priority: env > local > addon > defaults
function mergeConfigs() {
    const defaults = {
        database: {
            host: 'localhost',
            port: 3306,
            name: 'gym_lockers',
            username: 'gym_admin',
            password: 'gym_password'
        },
        mqtt: {
            use_internal: true,
            external: {
                host: '',
                port: 1883,
                username: '',
                password: ''
            }
        },
        system: {
            auto_refresh: 30,
            data_retention: 90,
            debug_mode: false
        }
    };
    
    const addonConfig = loadAddonConfig() || {};
    const localConfig = loadLocalConfig() || {};
    const envConfig = loadEnvConfig();
    
    // Deep merge function
    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                target[key] = target[key] || {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    
    const merged = { ...defaults };
    deepMerge(merged, addonConfig);
    deepMerge(merged, localConfig);
    deepMerge(merged, envConfig);
    
    return merged;
}

// Get the final configuration
const config = mergeConfigs();

// Log configuration summary
console.log('Configuration Summary:');
console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
console.log(`MQTT Internal: ${config.mqtt.use_internal ? 'Enabled' : 'Disabled'}`);
if (!config.mqtt.use_internal && config.mqtt.external.host) {
    console.log(`MQTT External: ${config.mqtt.external.host}:${config.mqtt.external.port}`);
}
console.log(`Auto Refresh: ${config.system.auto_refresh}s`);
console.log(`Data Retention: ${config.system.data_retention} days`);
console.log(`Debug Mode: ${config.system.debug_mode ? 'Enabled' : 'Disabled'}`);

// Export configuration with proper MQTT setup
module.exports = {
    ...config,
    mqttEnabled: config.mqtt.use_internal || (config.mqtt.external && config.mqtt.external.host),
    mqttConfig: config.mqtt.use_internal ? {
        host: '100.81.165.23',  // Use the actual server IP for native broker
        port: 1883,
        username: '',  // Anonymous access enabled
        password: '',
        clientId: 'gym-admin'
    } : (config.mqtt.external && config.mqtt.external.host ? {
        host: config.mqtt.external.host,
        port: config.mqtt.external.port || 1883,
        username: config.mqtt.external.username || '',
        password: config.mqtt.external.password || '',
        clientId: 'gym-admin'
    } : null)
};