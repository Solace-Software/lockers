#!/usr/bin/env node

/**
 * Configuration Validation Script for Gym Locker Admin Dashboard
 * 
 * This script validates the addon configuration and provides recommendations
 * for different deployment scales.
 */

const fs = require('fs');
const path = require('path');

// Configuration validation rules
const validationRules = {
  // Database configuration
  db_host: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255
  },
  db_port: {
    required: true,
    type: 'number',
    min: 1,
    max: 65535,
    default: 3306
  },
  db_user: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 64
  },
  db_password: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255
  },
  db_name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9_]+$/
  },

  // MQTT configuration
  mqtt_host: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255
  },
  mqtt_port: {
    required: true,
    type: 'number',
    min: 1,
    max: 65535,
    default: 1883
  },
  mqtt_username: {
    required: false,
    type: 'string',
    maxLength: 64
  },
  mqtt_password: {
    required: false,
    type: 'string',
    maxLength: 255
  },
  mqtt_client_id: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 64,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  mqtt_websocket_port: {
    required: false,
    type: 'number',
    min: 1,
    max: 65535,
    default: 9001
  },
  mqtt_allow_anonymous: {
    required: false,
    type: 'boolean',
    default: true
  },
  mqtt_max_connections: {
    required: false,
    type: 'number',
    min: 1,
    max: 1000,
    default: 100
  },
  mqtt_max_message_size: {
    required: false,
    type: 'number',
    min: 1,
    max: 65535,
    default: 1024
  },

  // System settings
  system_auto_refresh: {
    required: false,
    type: 'number',
    min: 5,
    max: 300,
    default: 30
  },
  system_data_retention_days: {
    required: false,
    type: 'number',
    min: 1,
    max: 3650,
    default: 90
  },
  system_backup_enabled: {
    required: false,
    type: 'boolean',
    default: true
  },
  system_debug_mode: {
    required: false,
    type: 'boolean',
    default: false
  },

  // Notification settings
  notifications_email_alerts: {
    required: false,
    type: 'boolean',
    default: true
  },
  notifications_usage_reports: {
    required: false,
    type: 'boolean',
    default: false
  },
  notifications_real_time_updates: {
    required: false,
    type: 'boolean',
    default: true
  },

  // Security settings
  security_session_timeout: {
    required: false,
    type: 'number',
    min: 5,
    max: 480,
    default: 30
  },
  security_password_policy: {
    required: false,
    type: 'string',
    enum: ['standard', 'strong', 'enterprise'],
    default: 'standard'
  },
  security_two_factor_auth: {
    required: false,
    type: 'boolean',
    default: false
  },
  security_audit_logging: {
    required: false,
    type: 'boolean',
    default: true
  }
};

// Scale recommendations
const scaleRecommendations = {
  small: {
    name: 'Small Scale (1-50 lockers)',
    description: 'Small gyms, fitness centers, community centers',
    requirements: {
      ram: '2GB minimum',
      storage: '10GB',
      database: 'Home Assistant MariaDB addon',
      mqtt: 'Home Assistant Mosquitto addon'
    },
    recommendedSettings: {
      mqtt_max_connections: 100,
      mqtt_max_message_size: 1024,
      system_auto_refresh: 30,
      system_data_retention_days: 90,
      system_backup_enabled: true,
      system_debug_mode: false,
      notifications_email_alerts: true,
      notifications_usage_reports: false,
      notifications_real_time_updates: true,
      security_session_timeout: 30,
      security_password_policy: 'standard',
      security_two_factor_auth: false,
      security_audit_logging: true
    }
  },
  medium: {
    name: 'Medium Scale (50-200 lockers)',
    description: 'Large gyms, sports complexes, universities',
    requirements: {
      ram: '4GB minimum',
      storage: '20GB (SSD recommended)',
      database: 'Dedicated MariaDB instance',
      mqtt: 'Home Assistant Mosquitto with authentication'
    },
    recommendedSettings: {
      mqtt_max_connections: 200,
      mqtt_max_message_size: 2048,
      system_auto_refresh: 15,
      system_data_retention_days: 180,
      system_backup_enabled: true,
      system_debug_mode: false,
      notifications_email_alerts: true,
      notifications_usage_reports: true,
      notifications_real_time_updates: true,
      security_session_timeout: 20,
      security_password_policy: 'strong',
      security_two_factor_auth: false,
      security_audit_logging: true
    }
  },
  large: {
    name: 'Large Scale (200+ lockers)',
    description: 'Multi-location gym chains, large sports facilities',
    requirements: {
      ram: '8GB minimum',
      storage: '50GB+ (SSD required)',
      database: 'Dedicated MariaDB server',
      mqtt: 'MQTT cluster or dedicated broker'
    },
    recommendedSettings: {
      mqtt_max_connections: 500,
      mqtt_max_message_size: 4096,
      system_auto_refresh: 10,
      system_data_retention_days: 365,
      system_backup_enabled: true,
      system_debug_mode: false,
      notifications_email_alerts: true,
      notifications_usage_reports: true,
      notifications_real_time_updates: true,
      security_session_timeout: 15,
      security_password_policy: 'enterprise',
      security_two_factor_auth: true,
      security_audit_logging: true
    }
  }
};

// Validation functions
function validateField(fieldName, value, rule) {
  const errors = [];
  const warnings = [];

  // Check if required
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return { errors, warnings };
  }

  // Skip validation if value is not provided and not required
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { errors, warnings };
  }

  // Type validation
  if (rule.type === 'string' && typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
  } else if (rule.type === 'number' && typeof value !== 'number') {
    errors.push(`${fieldName} must be a number`);
  } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${fieldName} must be a boolean`);
  }

  // Length validation for strings
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }
  }

  // Range validation for numbers
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} must be no more than ${rule.max}`);
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
  }

  // Security warnings
  if (fieldName.includes('password') && value && value.length < 8) {
    warnings.push(`${fieldName} should be at least 8 characters for security`);
  }

  if (fieldName === 'mqtt_allow_anonymous' && value === true) {
    warnings.push('Anonymous MQTT access is enabled - consider using authentication for production');
  }

  if (fieldName === 'security_two_factor_auth' && value === false) {
    warnings.push('Two-factor authentication is disabled - recommended for production environments');
  }

  return { errors, warnings };
}

function detectScale(config) {
  const mqttConnections = config.mqtt_max_connections || 100;
  const autoRefresh = config.system_auto_refresh || 30;
  const dataRetention = config.system_data_retention_days || 90;
  const twoFactorAuth = config.security_two_factor_auth || false;
  const passwordPolicy = config.security_password_policy || 'standard';

  if (mqttConnections >= 500 || autoRefresh <= 10 || dataRetention >= 365 || twoFactorAuth) {
    return 'large';
  } else if (mqttConnections >= 200 || autoRefresh <= 15 || dataRetention >= 180) {
    return 'medium';
  } else {
    return 'small';
  }
}

function validateConfiguration(config) {
  const errors = [];
  const warnings = [];
  const recommendations = [];

  console.log('🔍 Validating Gym Locker Admin Dashboard Configuration...\n');

  // Validate each field
  for (const [fieldName, rule] of Object.entries(validationRules)) {
    const value = config[fieldName];
    const validation = validateField(fieldName, value, rule);
    
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);
  }

  // Detect scale and provide recommendations
  const detectedScale = detectScale(config);
  const scaleInfo = scaleRecommendations[detectedScale];

  console.log(`📊 Detected Scale: ${scaleInfo.name}`);
  console.log(`📝 Description: ${scaleInfo.description}\n`);

  console.log('📋 Requirements for this scale:');
  for (const [requirement, value] of Object.entries(scaleInfo.requirements)) {
    console.log(`   • ${requirement}: ${value}`);
  }
  console.log('');

  // Check if current settings match recommendations
  console.log('⚙️ Configuration Analysis:');
  for (const [setting, recommendedValue] of Object.entries(scaleInfo.recommendedSettings)) {
    const currentValue = config[setting];
    if (currentValue !== undefined && currentValue !== recommendedValue) {
      recommendations.push(`${setting}: current=${currentValue}, recommended=${recommendedValue}`);
    }
  }

  // Display results
  if (errors.length > 0) {
    console.log('❌ Validation Errors:');
    errors.forEach(error => console.log(`   • ${error}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('');
  }

  if (recommendations.length > 0) {
    console.log('💡 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0 && recommendations.length === 0) {
    console.log('✅ Configuration is valid and optimized for your scale!');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
    detectedScale,
    scaleInfo
  };
}

// Main execution
function main() {
  let config = {};

  // Try to load configuration from different sources
  const configSources = [
    '/data/options.json', // Home Assistant addon config
    path.join(__dirname, 'local-config.json'), // Local development config
    process.env.CONFIG_FILE // Environment variable
  ];

  for (const source of configSources) {
    try {
      if (fs.existsSync(source)) {
        config = JSON.parse(fs.readFileSync(source, 'utf8'));
        console.log(`📋 Loaded configuration from: ${source}`);
        break;
      }
    } catch (error) {
      console.log(`⚠️  Could not load configuration from: ${source}`);
    }
  }

  if (Object.keys(config).length === 0) {
    console.log('❌ No configuration found. Please provide a configuration file.');
    console.log('Available sources:');
    console.log('   • /data/options.json (Home Assistant addon)');
    console.log('   • local-config.json (local development)');
    console.log('   • CONFIG_FILE environment variable');
    process.exit(1);
  }

  const result = validateConfiguration(config);

  // Exit with appropriate code
  if (!result.isValid) {
    console.log('❌ Configuration validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('✅ Configuration validation completed successfully!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateConfiguration,
  validationRules,
  scaleRecommendations,
  detectScale
}; 