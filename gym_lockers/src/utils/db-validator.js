const mysql = require('mysql2/promise');

class DatabaseValidator {
  constructor(config) {
    this.config = config;
  }

  async validateConnection() {
    let connection;
    try {
      // Try to connect
      connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database
      });

      // Test the connection
      await connection.query('SELECT 1');

      // Check if we can create tables
      await this.checkPermissions(connection);

      return {
        success: true,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  async checkPermissions(connection) {
    try {
      // Try to create a temporary table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS _permission_test (
          id INT PRIMARY KEY
        )
      `);

      // Try to insert data
      await connection.query('INSERT INTO _permission_test (id) VALUES (1)');

      // Try to create an index
      await connection.query('CREATE INDEX idx_test ON _permission_test (id)');

      // Clean up
      await connection.query('DROP TABLE _permission_test');
    } catch (error) {
      throw new Error('Insufficient database permissions: ' + error.message);
    }
  }

  getErrorMessage(error) {
    switch (error.code) {
      case 'ECONNREFUSED':
        return `Cannot connect to database at ${this.config.host}:${this.config.port}. Please check if the database is running and accessible.`;
      case 'ER_ACCESS_DENIED_ERROR':
        return 'Access denied. Please check your database username and password.';
      case 'ER_BAD_DB_ERROR':
        return `Database '${this.config.database}' does not exist.`;
      case 'ER_NOT_SUPPORTED_AUTH_MODE':
        return 'Authentication method not supported. Please check your database configuration.';
      default:
        return `Database connection error: ${error.message}`;
    }
  }
}

module.exports = DatabaseValidator;