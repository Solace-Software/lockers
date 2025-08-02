# Solace Technologies - Lockers

A comprehensive all-in-one locker management system for gym facilities. Features real-time monitoring, RFID management, user assignment, and analytics dashboard - everything runs in a single Home Assistant addon with no external dependencies.

## 🚀 Quick Start

1. **Add the repository** to your Home Assistant addon store
2. **Install "Solace Technologies - Lockers"** from the store
3. **Start the addon** - no external database or MQTT broker required
4. **Access the dashboard** via the web UI

## 📋 Features

- **All-in-One Solution**: Complete system in a single addon - no external dependencies
- **Real-time Locker Monitoring**: Live status updates via integrated MQTT broker
- **RFID Tag Management**: Assign and manage RFID tags for users
- **User Management**: Complete user lifecycle management
- **Locker Groups**: Organize lockers into logical groups
- **Activity Analytics**: Track usage patterns and statistics
- **Modern Web Dashboard**: Responsive, intuitive web interface
- **Integrated Database**: Built-in MariaDB database
- **Integrated MQTT Broker**: Built-in Mosquitto broker for real-time communication
- **Security**: Role-based access control and audit logging

## 🏗️ Architecture

This addon uses an **all-in-one architecture** where everything runs in a single container:

```
Solace Technologies - Lockers Addon
├── Node.js Backend (Express.js)
├── React Frontend (Built and served)
├── MariaDB Database (Integrated)
├── Mosquitto MQTT Broker (Integrated)
└── Supervisor (Process management)
```

**Benefits:**
- ✅ **Zero external dependencies** - Everything included
- ✅ **Easy installation** - One-click setup
- ✅ **Consistent performance** - Optimized for the addon
- ✅ **Simple maintenance** - Single container to manage

## ⚙️ Configuration

The addon comes pre-configured with sensible defaults. All services are integrated and ready to use immediately.

### Default Configuration

```json
{
  "db_password": "secure_password_123",
  "mqtt_username": "gym_mqtt_user", 
  "mqtt_password": "mqtt_password_123",
  "mqtt_client_id": "gym-admin-ha-addon",
  "mqtt_websocket_port": 9001,
  "mqtt_allow_anonymous": true,
  "mqtt_max_connections": 100,
  "mqtt_max_message_size": 1024,
  "system_auto_refresh": 30,
  "system_data_retention_days": 90,
  "system_backup_enabled": true,
  "system_debug_mode": false,
  "security_session_timeout": 30,
  "security_password_policy": "standard",
  "security_two_factor_auth": false,
  "security_audit_logging": true
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

#### Security Settings
- `security_session_timeout`: Session timeout in minutes (5-480, default: 30)
- `security_password_policy`: Password policy (standard|strong|enterprise, default: standard)
- `security_two_factor_auth`: Enable 2FA for admin access (default: false)
- `security_audit_logging`: Log all admin actions (default: true)

## 🔧 Installation

### Prerequisites

- **Home Assistant Core/Supervisor**: Version 2023.8 or later
- **No external dependencies required** - Everything is included!

### Installation Steps

1. **Add the repository** to Home Assistant:
   - Go to **Settings** → **Add-ons** → **Add-on Store**
   - Click the three dots menu → **Repositories**
   - Add: `https://github.com/Solace-Software/lockers`

2. **Install the addon**:
   - Find **"Solace Technologies - Lockers"** in the addon store
   - Click **Install**

3. **Start the addon**:
   - Click **Start** - no additional configuration required
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

The addon includes a built-in MQTT broker for real-time communication.

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

#### Addon Won't Start

**Symptoms**: Addon fails to start, shows error status

**Solutions**:
1. Check Home Assistant logs for detailed error messages
2. Verify sufficient system resources (RAM, storage)
3. Restart the addon
4. Check port conflicts (addon uses ports 3001, 1883, 9001, 3306)

#### Web UI Not Accessible

**Symptoms**: Cannot access dashboard, 404 errors

**Solutions**:
1. Check addon is running (green status)
2. Try accessing via Home Assistant ingress
3. Check browser console for JavaScript errors
4. Verify no firewall blocking port 3001

#### MQTT Connection Issues

**Symptoms**: No real-time updates, MQTT connection errors

**Solutions**:
1. Verify built-in MQTT broker is running
2. Check MQTT credentials in addon configuration
3. Test MQTT connection using the dashboard test button
4. Restart the addon to reset MQTT broker

### Log Analysis

Access addon logs in Home Assistant:
1. Go to **Settings** → **Add-ons**
2. Find **"Solace Technologies - Lockers"**
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

### Built-in Security
- **Integrated database**: No external database connections
- **Built-in MQTT broker**: No external MQTT dependencies
- **Container isolation**: Secure process isolation
- **Audit logging**: Track all admin actions

### Best Practices
- Use strong passwords for admin access
- Enable `security_audit_logging` for compliance
- Regularly update the addon
- Monitor system logs for anomalies

## 📈 Scaling Considerations

### Small Installation (< 50 lockers)
- Default configuration is sufficient
- Built-in database handles load well
- Integrated MQTT broker provides real-time updates

### Medium Installation (50-200 lockers)
- Monitor system resources
- Enable `system_backup_enabled`
- Configure appropriate data retention
- Consider dedicated Home Assistant instance

### Large Installation (> 200 lockers)
- Dedicated Home Assistant instance recommended
- Monitor container resource usage
- Separate backup strategy
- Load balancing for web interface
- Monitoring and alerting setup

## 🔄 Updates and Maintenance

### Updating the Addon
1. Check for updates in Home Assistant addon store
2. Backup configuration before updating
3. Review changelog for breaking changes
4. Test functionality after update

### Data Maintenance
- Regular backups (automated with `system_backup_enabled`)
- Monitor database size and performance
- Clean old logs periodically
- Optimize data retention settings

### System Monitoring
- Monitor container resource usage
- Check MQTT broker performance
- Monitor database performance
- Review audit logs regularly

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
- **All-in-one architecture**: Complete system in single container
- **Solace Technologies branding**: Updated addon title and branding
- **Integrated services**: Built-in database and MQTT broker
- **Zero dependencies**: No external database or MQTT broker required
- **Enhanced configuration**: Comprehensive configuration options
- **Improved documentation**: Updated README for all-in-one solution

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