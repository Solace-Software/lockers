# Deployment Guide

## Database Configuration

The Gym Lockers Management System requires an external MariaDB/MySQL database. This design choice ensures better scalability, maintenance, and security.

### Database Requirements

- MariaDB 10.6+ or MySQL 8.0+
- A dedicated database user with the following permissions:
  - CREATE/ALTER tables
  - INSERT/UPDATE/DELETE data
  - CREATE indexes
- The database must be created before deployment

### Configuration Steps

1. **Prepare Your Database**:
   ```sql
   CREATE DATABASE gym_lockers;
   CREATE USER 'gym_user'@'%' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **Configure Database Connection**:
   Set the following environment variables or update your configuration file:
   ```env
   DB_HOST=your-db-host
   DB_PORT=3306
   DB_NAME=gym_lockers
   DB_USER=your-db-user
   DB_PASSWORD=your-secure-password
   ```

## Deployment Steps

1. **Configuration**:
   - Copy `.env.example` to `.env`
   - Update database connection details
   - Configure MQTT settings if needed

2. **Start the Application**:
   ```bash
   docker-compose up -d
   ```

3. **Verify Deployment**:
   - Check application logs: `docker-compose logs -f`
   - Access web interface: `http://your-host:3001`
   - Test database connection through the UI

## Configuration Options

### Required Settings

| Option | Description | Default |
|--------|-------------|---------|
| DB_HOST | Database hostname | - |
| DB_PORT | Database port | 3306 |
| DB_NAME | Database name | gym_lockers |
| DB_USER | Database username | - |
| DB_PASSWORD | Database password | - |

### Optional Settings

| Option | Description | Default |
|--------|-------------|---------|
| MQTT_USERNAME | MQTT username | - |
| MQTT_PASSWORD | MQTT password | - |
| MQTT_CLIENT_ID | MQTT client ID | gym-admin-docker |

## Troubleshooting

### Database Connection Issues

1. **Connection Refused**:
   - Verify database host and port
   - Check firewall settings
   - Ensure database service is running

2. **Access Denied**:
   - Verify database credentials
   - Check user permissions
   - Confirm database exists

3. **Schema Issues**:
   - Check database logs
   - Verify user has necessary permissions
   - Review schema migration status

## Security Best Practices

1. **Database Security**:
   - Use strong passwords
   - Limit database user permissions
   - Enable SSL for database connections
   - Regular security updates

2. **Environment Variables**:
   - Never commit .env files
   - Use secrets management in production
   - Rotate credentials regularly

3. **Network Security**:
   - Use private networks when possible
   - Configure firewalls appropriately
   - Monitor access logs