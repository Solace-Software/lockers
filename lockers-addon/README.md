# Gym Locker Admin Dashboard - Home Assistant Addon

A comprehensive locker management system with MQTT integration for gym facilities. Features real-time monitoring, RFID management, user assignment, and analytics dashboard.

## 🚀 Quick Start

1. **Add the repository** to your Home Assistant addon store
2. **Install the addon** from the store
3. **Configure the settings** (see Configuration section below)
4. **Start the addon** and access the dashboard

## 📋 Features

- **Real-time Locker Monitoring**: Live status updates via MQTT
- **RFID Tag Management**: Assign and manage RFID tags for users
- **User Management**: Complete user lifecycle management
- **Locker Groups**: Organize lockers into logical groups
- **Activity Analytics**: Track usage patterns and statistics
- **Web Dashboard**: Modern, responsive web interface
- **MQTT Integration**: Seamless integration with Home Assistant MQTT
- **Database Storage**: Persistent data storage with MariaDB
- **Security**: Role-based access control and audit logging

## ⚙️ Configuration

### Database Configuration

The addon requires a MariaDB database. You can use the Home Assistant MariaDB addon or configure an external database.

#### Option 1: Home Assistant MariaDB Addon (Recommended)

1. Install the **MariaDB** addon from the Home Assistant addon store
2. Configure the MariaDB addon with:
   - Database name: `gym_lockers`
   - Username: `gym_admin`
   - Password: `your_secure_password`
3. In the Gym Locker Dashboard addon configuration:
   ```json
   {
     "db_host": "core-mariadb",
     "db_port": 3306,
     "db_user": "gym_admin",
     "db_password": "your_secure_password",
     "db_name": "gym_lockers"
   }
   ```

#### Option 2: External Database

If using an external MariaDB/MySQL database:
```json
{
  "db_host": "your-database-host",
  "db_port": 3306,
  "db_user": "your_username",
  "db_password": "your_password",
  "db_name": "gym_lockers"
}
```

### MQTT Configuration

The addon integrates with Home Assistant's MQTT broker for real-time communication.

#### Option 1: Home Assistant MQTT Addon (Recommended)

1. Install the **Mosquitto broker** addon from the Home Assistant addon store
2. Configure the MQTT settings:
   ```json
   {
     "mqtt_host": "core-mosquitto",
     "mqtt_port": 1883,
     "mqtt_username": "",
     "mqtt_password": "",
     "mqtt_client_id": "gym-admin"
   }
   ```

#### Option 2: External MQTT Broker

For external MQTT brokers:
```json
{
  "mqtt_host": "your-mqtt-broker-host",
  "mqtt_port": 1883,
  "mqtt_username": "your_mqtt_username",
  "mqtt_password": "your_mqtt_password",
  "mqtt_client_id": "gym-admin"
}
```

### Advanced Configuration

#### MQTT Settings
- `mqtt_websocket_port`: WebSocket port for MQTT (default: 9001)
- `mqtt_allow_anonymous`: Allow anonymous MQTT connections (default: true)
- `mqtt_max_connections`: Maximum MQTT connections (default: 100)
- `mqtt_max_message_size`: Maximum message size in bytes (default: 1024)

#### System Settings
- `system_auto_refresh`: Auto-refresh interval in seconds (5-300, default: 30)
- `system_data_retention_days`: Data retention period (1-3650, default: 90)
- `system_backup_enabled`: Enable automatic backups (default: true)
- `system_debug_mode`: Enable debug logging (default: false)

#### Notification Settings
- `notifications_email_alerts`: Email alerts for important events (default: true)
- `notifications_usage_reports`: Weekly usage reports (default: false)
- `notifications_real_time_updates`: Real-time update notifications (default: true)

#### Security Settings
- `security_session_timeout`: Session timeout in minutes (5-480, default: 30)
- `security_password_policy`: Password policy (standard|strong|enterprise, default: standard)
- `security_two_factor_auth`: Enable 2FA for admin access (default: false)
- `security_audit_logging`: Log all admin actions (default: true)

## 🔧 Installation

### Prerequisites

1. **Home Assistant Core/Supervisor**: Version 2023.8 or later
2. **MariaDB Addon**: For database storage
3. **Mosquitto Broker Addon**: For MQTT communication

### Installation Steps

1. **Add the repository** to Home Assistant:
   - Go to **Settings** → **Add-ons** → **Add-on Store**
   - Click the three dots menu → **Repositories**
   - Add: `https://github.com/Solace-Software/lockers`

2. **Install the addon**:
   - Find "Gym Locker Admin Dashboard" in the addon store
   - Click **Install**

3. **Configure the addon**:
   - Click **Configuration** tab
   - Set up database and MQTT settings (see Configuration section)
   - Click **Save**

4. **Start the addon**:
   - Click **Start**
   - Access the dashboard via the **Open Web UI** button

## 📊 Dashboard Features

### Main Dashboard
- **Real-time locker status**: Live updates of locker availability
- **User management**: Add, edit, and manage users
- **RFID tag assignment**: Link RFID tags to users
- **Activity monitoring**: Track locker usage and events

### Analytics
- **Usage statistics**: Daily, weekly, and monthly reports
- **User activity**: Track individual user patterns
- **Locker utilization**: Monitor locker usage efficiency
- **System health**: Monitor system performance

### Settings
- **MQTT configuration**: Test and configure MQTT connections
- **System preferences**: Configure auto-refresh, data retention
- **Security settings**: Manage authentication and access control
- **Notification preferences**: Configure alert settings

## 🔌 MQTT Integration

### Topic Structure

The addon uses the following MQTT topic structure:

```
gym/lockers/{locker_id}/status      # Locker status updates
gym/lockers/{locker_id}/rfid        # RFID scan events
gym/lockers/{locker_id}/heartbeat   # Locker heartbeat
gym/lockers/{locker_id}/command     # Commands to lockers
```

### Message Format

**Status Update**:
```json
{
  "locker_id": "L001",
  "status": "occupied|available|maintenance",
  "user_id": "user123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**RFID Scan**:
```json
{
  "locker_id": "L001",
  "rfid_tag": "1234567890",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Heartbeat**:
```json
{
  "locker_id": "L001",
  "status": "online",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Issues

**Symptoms**: Addon fails to start, database connection errors in logs

**Solutions**:
1. Verify MariaDB addon is running
2. Check database credentials in addon configuration
3. Ensure database exists: `CREATE DATABASE gym_lockers;`
4. Verify user permissions: `GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'%';`

#### MQTT Connection Issues

**Symptoms**: No real-time updates, MQTT connection errors

**Solutions**:
1. Verify Mosquitto broker addon is running
2. Check MQTT credentials in addon configuration
3. Test MQTT connection using the dashboard test button
4. Verify network connectivity between addons

#### Web UI Not Accessible

**Symptoms**: Cannot access dashboard, 404 errors

**Solutions**:
1. Check addon is running (green status)
2. Verify port 3001 is not blocked
3. Try accessing via Home Assistant ingress
4. Check browser console for JavaScript errors

### Log Analysis

Access addon logs in Home Assistant:
1. Go to **Settings** → **Add-ons**
2. Find "Gym Locker Admin Dashboard"
3. Click **Logs** tab

**Common log patterns**:
- `✅ Database connected successfully` - Database working
- `✅ MQTT connected successfully` - MQTT working
- `❌ Database connection failed` - Database issue
- `❌ MQTT connection failed` - MQTT issue

### Performance Issues

**Symptoms**: Slow dashboard, delayed updates

**Solutions**:
1. Increase `system_auto_refresh` interval
2. Reduce `mqtt_max_connections` if needed
3. Enable `system_debug_mode` for detailed logging
4. Check system resources in Home Assistant

## 🔒 Security Considerations

### Database Security
- Use strong passwords for database users
- Limit database user permissions to necessary operations
- Regularly backup database data
- Enable `security_audit_logging` for compliance

### MQTT Security
- Use authentication for MQTT broker
- Implement TLS/SSL for MQTT connections
- Use unique client IDs for each installation
- Monitor MQTT traffic for anomalies

### Web Security
- Enable `security_two_factor_auth` for admin access
- Use strong password policies
- Configure appropriate session timeouts
- Regularly update the addon

## 📈 Scaling Considerations

### Small Installation (< 50 lockers)
- Default configuration is sufficient
- Single MariaDB instance
- Standard MQTT broker setup

### Medium Installation (50-200 lockers)
- Consider dedicated MariaDB instance
- Monitor MQTT message volume
- Enable `system_backup_enabled`
- Configure appropriate data retention

### Large Installation (> 200 lockers)
- Dedicated database server
- MQTT cluster for high availability
- Separate backup strategy
- Load balancing for web interface
- Monitoring and alerting setup

## 🔄 Updates and Maintenance

### Updating the Addon
1. Check for updates in Home Assistant addon store
2. Backup configuration before updating
3. Review changelog for breaking changes
4. Test functionality after update

### Database Maintenance
- Regular backups (automated with `system_backup_enabled`)
- Monitor database size and performance
- Clean old logs periodically
- Optimize database queries as needed

### MQTT Maintenance
- Monitor MQTT broker performance
- Clean up old retained messages
- Update MQTT broker security settings
- Monitor connection stability

## 📞 Support

### Getting Help
1. Check this README for common solutions
2. Review addon logs for error details
3. Search existing GitHub issues
4. Create new issue with detailed information

### Reporting Issues
When reporting issues, please include:
- Home Assistant version
- Addon version
- Configuration (without passwords)
- Error logs
- Steps to reproduce

### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏷️ Version History

### v1.2.0 (Latest)
- **Enhanced configuration schema**: Added comprehensive configuration options
- **Improved error handling**: Better MQTT connection testing and error messages
- **Scalability improvements**: Support for larger installations
- **Security enhancements**: Additional security configuration options
- **Documentation updates**: Comprehensive README and configuration guide

### v1.1.4
- **Removed hardcoded credentials**: Secure configuration system
- **Home Assistant integration**: Proper addon configuration support
- **Security documentation**: Comprehensive security guide

### v1.1.3
- **Fixed container networking**: Home Assistant container name resolution
- **MQTT connection fixes**: Updated for core-mosquitto integration
- **Database connection fixes**: Updated for core-mariadb integration

### v1.1.2
- **Fixed 503 errors**: Improved static file serving
- **Docker compatibility**: Fixed build path issues
- **Enhanced error handling**: Better fallbacks for missing files

### v1.1.1
- **Home Assistant addon support**: Proper ingress and routing
- **Web UI improvements**: Fixed URL formatting and access

### v1.1.0
- **Fixed MQTT message flood**: Implemented topic filtering
- **Performance improvements**: Reduced memory usage
- **Stability enhancements**: Better error handling and recovery

### v1.0.0
- **Initial release**: Basic locker management functionality
- **MQTT integration**: Real-time updates
- **Web dashboard**: User-friendly interface 