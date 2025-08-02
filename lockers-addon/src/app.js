const express = require('express');
const { dbConfig, mqttConfig, systemSettings } = require('../config');
const ConfigValidator = require('./utils/config-validator');
const Database = require('../database');

class Application {
  constructor() {
    this.app = express();
    this.isReady = false;
  }

  async initialize() {
    try {
      // Validate configuration before starting
      const validator = new ConfigValidator({
        dbConfig,
        mqttConfig,
        mqttEnabled: !!mqttConfig,
        systemSettings
      });

      const validation = await validator.validate();
      
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => console.error(`   - ${error}`));
        validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
        
        // Set up a basic endpoint to show configuration errors
        this.setupConfigurationErrorEndpoint(validation);
        return false;
      }

      // Initialize database
      this.db = new Database();
      await this.db.connect();

      // Initialize other services
      await this.setupServices();
      
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      return false;
    }
  }

  setupConfigurationErrorEndpoint(validation) {
    this.app.get('*', (req, res) => {
      res.status(500).json({
        status: 'error',
        message: 'Application configuration error',
        errors: validation.errors,
        warnings: validation.warnings,
        help: 'Please check your configuration in the Home Assistant addon configuration tab.'
      });
    });
  }

  async setupServices() {
    // Setup your routes and services here
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        database: this.db.isConnected ? 'connected' : 'disconnected',
        mqtt: mqttConfig ? 'configured' : 'not configured'
      });
    });

    // Add more service initialization here
  }

  getApp() {
    return this.app;
  }
}

module.exports = Application;