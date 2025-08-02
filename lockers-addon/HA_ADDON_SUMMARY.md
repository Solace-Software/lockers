# Gym Locker Admin Dashboard - Home Assistant Addon

## Overview

A complete gym locker management system designed specifically for Home Assistant. This addon provides:

- **Internal Database**: Always uses an internal MariaDB database (no external credentials required)
- **Optional MQTT**: Can be disabled or configured through the addon configuration
- **Web Interface**: Full-featured admin dashboard accessible through Home Assistant
- **No External Dependencies**: Everything runs internally within the addon

## Key Features

### 🔧 **Internal Database**
- Always uses internal MariaDB database
- No external database credentials required
- Automatic database initialization and schema setup
- Persistent data storage

### 📡 **Optional MQTT Configuration**
- **MQTT Disabled**: App runs without MQTT connectivity
- **Built-in MQTT**: Uses internal Mosquitto broker
- **External MQTT**: Connect to external MQTT broker
- **UI Configuration**: MQTT settings can be configured through the web interface

### 🌐 **Web Interface**
- Accessible through Home Assistant Ingress
- Full locker management capabilities
- User and group management
- Real-time status monitoring
- Settings configuration

## Configuration Options

### MQTT Settings
- `mqtt_enabled`: Enable/disable MQTT functionality
- `use_external_mqtt`: Use external MQTT broker
- `external_mqtt_host`: External MQTT broker hostname
- `external_mqtt_port`: External MQTT broker port
- `external_mqtt_username`: External MQTT username
- `external_mqtt_password`: External MQTT password
- `external_mqtt_client_id`: External MQTT client ID

### System Settings
- `system_auto_refresh`: Auto-refresh interval (5-300 seconds)
- `system_data_retention_days`: Data retention period (1-3650 days)
- `system_backup_enabled`: Enable automatic backups
- `system_debug_mode`: Enable debug mode

### Notification Settings
- `notifications_email_alerts`: Enable email alerts
- `notifications_usage_reports`: Enable usage reports
- `notifications_real_time_updates`: Enable real-time updates

### Security Settings
- `security_session_timeout`: Session timeout (5-480 minutes)
- `security_password_policy`: Password policy (standard/strong/enterprise)
- `security_two_factor_auth`: Enable two-factor authentication
- `security_audit_logging`: Enable audit logging

## Installation

1. Add the repository to Home Assistant
2. Install the "Gym Locker Admin Dashboard" addon
3. Configure settings as needed
4. Start the addon
5. Access through Home Assistant sidebar

## Usage

### Initial Setup
1. The addon will automatically initialize the database
2. Access the web interface through Home Assistant
3. Configure MQTT settings if needed
4. Add lockers, users, and groups

### MQTT Configuration
- **Disabled**: App runs without MQTT (default)
- **Built-in**: Uses internal MQTT broker
- **External**: Connect to external MQTT broker
- **UI Configuration**: Change settings through web interface

### Database Management
- Database is automatically managed
- No external database setup required
- Data persists across addon restarts
- Automatic backups (if enabled)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Home Assistant Addon                     │
├─────────────────────────────────────────────────────────────┤
│  Web Interface (Port 3001)                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Dashboard     │  │   Settings      │  │   Users     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Node.js Application                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   API Server    │  │   Socket.IO     │  │   Database  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Internal Services                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   MariaDB       │  │   Mosquitto     │  │   Supervisor│ │
│  │   (Database)    │  │   (MQTT)        │  │   (Manager) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

### ✅ **No External Dependencies**
- Everything runs within the addon
- No external database setup required
- No external MQTT broker needed
- Self-contained solution

### ✅ **Flexible MQTT Configuration**
- Can run without MQTT
- Built-in MQTT broker available
- External MQTT broker support
- Configuration through UI

### ✅ **Home Assistant Integration**
- Native Home Assistant addon
- Ingress support
- Configuration through Home Assistant UI
- Persistent data storage

### ✅ **Easy Management**
- Web-based admin interface
- Real-time status monitoring
- User and locker management
- Comprehensive logging

## Troubleshooting

### MQTT Not Connected
- Check if MQTT is enabled in addon configuration
- Verify MQTT settings in web interface
- Check logs for connection errors

### Database Issues
- Database is automatically managed
- Check addon logs for database errors
- Restart addon if needed

### Web Interface Not Accessible
- Ensure addon is started
- Check Home Assistant ingress settings
- Verify port 3001 is accessible

## Version History

### v1.4.0 (Current)
- ✅ Internal database only (no external credentials)
- ✅ Optional MQTT configuration
- ✅ Enhanced configuration options
- ✅ Improved error handling
- ✅ Better Home Assistant integration

### v1.3.8 (Previous)
- External database support
- Required MQTT configuration
- Limited configuration options 