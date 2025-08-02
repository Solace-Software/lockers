const DatabaseValidator = require('./db-validator');

class ConfigValidator {
  constructor(config) {
    this.config = config;
  }

  async validate() {
    const results = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate database configuration
    const dbValidation = await this.validateDatabase();
    if (!dbValidation.success) {
      results.isValid = false;
      results.errors.push(dbValidation.message);
    }

    // Validate MQTT configuration if enabled
    if (this.config.mqttEnabled) {
      const mqttValidation = this.validateMQTT();
      if (!mqttValidation.success) {
        results.warnings.push(mqttValidation.message);
      }
    }

    return results;
  }

  async validateDatabase() {
    // Check if required database fields are present
    const requiredFields = ['host', 'port', 'user', 'password', 'database'];
    const missingFields = requiredFields.filter(field => !this.config.dbConfig[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required database configuration: ${missingFields.join(', ')}`
      };
    }

    // Validate database connection
    const validator = new DatabaseValidator(this.config.dbConfig);
    return await validator.validateConnection();
  }

  validateMQTT() {
    if (!this.config.mqttConfig) {
      return {
        success: false,
        message: 'MQTT configuration is missing'
      };
    }

    const { host, port } = this.config.mqttConfig;
    if (!host || !port) {
      return {
        success: false,
        message: 'MQTT host and port are required'
      };
    }

    return { success: true };
  }
}

module.exports = ConfigValidator;