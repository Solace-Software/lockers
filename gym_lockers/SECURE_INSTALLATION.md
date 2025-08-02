# Secure Installation Guide

This guide explains how to securely install and configure the Gym Locker Dashboard addon without hardcoded credentials.

## 🔒 Security Principles

- **No hardcoded credentials** in the codebase
- **All credentials configured** via Home Assistant addon configuration
- **Environment-specific settings** for different deployment scenarios
- **Secure credential management** through Home Assistant's built-in system

## 📋 Configuration Options

### Home Assistant Addon Configuration

The addon uses Home Assistant's configuration system. All credentials are set through the addon configuration UI:

```json
{
  "db_host": "core-mariadb",
  "db_port": 3306,
  "db_user": "",
  "db_password": "",
  "db_name": "gym_lockers",
  "mqtt_host": "core-mosquitto",
  "mqtt_port": 1883,
  "mqtt_username": "",
  "mqtt_password": "",
  "mqtt_client_id": "gym-admin"
}
```

### Environment Variables (Docker/Development)

For Docker or development environments, use environment variables:

```bash
# Database Configuration
DB_HOST=mariadb
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=gym_lockers

# MQTT Configuration
MQTT_HOST=mosquitto
MQTT_PORT=1883
MQTT_USERNAME=your_mqtt_user
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=gym-admin
```

## 🏠 Home Assistant Installation

### Step 1: Install the Addon
1. Go to **Home Assistant** → **Settings** → **Add-ons** → **Add-on Store**
2. Add the repository: `https://github.com/Solace-Software/lockers`
3. Install the **Gym Locker Dashboard** addon

### Step 2: Configure Database
1. Open the **Gym Locker Dashboard** addon
2. Go to **Configuration** tab
3. Set the database credentials:

#### Option A: Use Home Assistant MariaDB Addon
```json
{
  "db_host": "core-mariadb",
  "db_port": 3306,
  "db_user": "homeassistant",
  "db_password": "your_mariadb_password",
  "db_name": "gym_lockers"
}
```

#### Option B: Use External MariaDB
```json
{
  "db_host": "your-db-server.com",
  "db_port": 3306,
  "db_user": "your_db_user",
  "db_password": "your_db_password",
  "db_name": "gym_lockers"
}
```

### Step 3: Configure MQTT
1. In the same configuration, set MQTT credentials:

#### Option A: Use Home Assistant Mosquitto Addon
```json
{
  "mqtt_host": "core-mosquitto",
  "mqtt_port": 1883,
  "mqtt_username": "",
  "mqtt_password": "",
  "mqtt_client_id": "gym-admin"
}
```

#### Option B: Use External MQTT Broker
```json
{
  "mqtt_host": "your-mqtt-server.com",
  "mqtt_port": 1883,
  "mqtt_username": "your_mqtt_user",
  "mqtt_password": "your_mqtt_password",
  "mqtt_client_id": "gym-admin"
}
```

### Step 4: Start the Addon
1. Click **Start** to launch the addon
2. Check the **Logs** tab for any configuration errors
3. Access the web interface via the **Open Web UI** button

## 🐳 Docker Installation

### Step 1: Create Environment File
Create a `.env` file in the project directory:

```bash
# Database Configuration
DB_HOST=mariadb
DB_PORT=3306
DB_USER=solace
DB_PASSWORD=your_secure_password
DB_NAME=gym_lockers

# MQTT Configuration
MQTT_HOST=mosquitto
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=gym-admin-docker
```

### Step 2: Start Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔧 Database Setup

### For Home Assistant MariaDB Addon

1. **Access MariaDB Addon**:
   - Go to **Settings** → **Add-ons** → **MariaDB**
   - Click **Terminal** tab

2. **Create Database and User**:
   ```sql
   -- Connect to MariaDB
   mysql -u root -p
   
   -- Create database
   CREATE DATABASE IF NOT EXISTS gym_lockers;
   
   -- Create user (replace with your credentials)
   CREATE USER 'gym_user'@'%' IDENTIFIED BY 'your_secure_password';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_user'@'%';
   FLUSH PRIVILEGES;
   
   -- Exit
   EXIT;
   ```

3. **Update Addon Configuration**:
   ```json
   {
     "db_user": "gym_user",
     "db_password": "your_secure_password"
   }
   ```

### For External Database

1. **Create Database**:
   ```sql
   CREATE DATABASE gym_lockers;
   ```

2. **Create User**:
   ```sql
   CREATE USER 'gym_user'@'%' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_user'@'%';
   FLUSH PRIVILEGES;
   ```

## 🔍 Troubleshooting

### Configuration Issues

1. **Check Addon Logs**:
   - Go to addon → **Logs** tab
   - Look for configuration errors

2. **Verify Database Connection**:
   ```bash
   # Test database connection
   mysql -h your_db_host -u your_user -p gym_lockers
   ```

3. **Verify MQTT Connection**:
   ```bash
   # Test MQTT connection
   mosquitto_pub -h your_mqtt_host -t "test/topic" -m "test"
   ```

### Common Errors

#### "Database connection failed"
- Check database credentials in addon configuration
- Verify database server is running
- Ensure network connectivity

#### "MQTT connection failed"
- Check MQTT credentials in addon configuration
- Verify MQTT broker is running
- Ensure network connectivity

#### "Permission denied"
- Verify user has proper database permissions
- Check firewall settings
- Ensure correct host/port configuration

## 🔐 Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords for database and MQTT users
2. **Limit Network Access**: Use firewalls to restrict database and MQTT access
3. **Regular Updates**: Keep the addon and dependencies updated
4. **Monitor Logs**: Regularly check addon logs for security issues
5. **Backup Configuration**: Keep secure backups of your configuration

## 📞 Support

For issues or questions:
1. Check the addon logs for error messages
2. Verify all configuration settings
3. Test network connectivity to database and MQTT servers
4. Consult the troubleshooting section above 