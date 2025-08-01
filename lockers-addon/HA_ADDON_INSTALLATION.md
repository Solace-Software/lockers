# Home Assistant Addon All-in-One Installation Guide

## 🎯 Overview

This guide shows how to install and configure the **Gym Locker Admin Dashboard - All-in-One** Home Assistant addon. This addon includes everything you need in one package:

- ✅ **MariaDB Database** (internal)
- ✅ **Mosquitto MQTT Broker** (internal)
- ✅ **Gym Locker Dashboard** (web interface)
- ✅ **No external dependencies** required

## 🚀 Quick Installation

### Step 1: Add the Repository

1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the three dots menu (⋮) → **Repositories**
3. Add: `https://github.com/Solace-Software/lockers`
4. Click **Add**

### Step 2: Install the Addon

1. Find **"Gym Locker Admin Dashboard - All-in-One"** in the addon store
2. Click **Install**
3. Wait for the installation to complete

### Step 3: Configure the Addon

1. Click **Configuration** tab
2. Configure your settings (see Configuration section below)
3. Click **Save**

### Step 4: Start the Addon

1. Click **Start**
2. Wait for all services to initialize
3. Click **Open Web UI** to access the dashboard

## ⚙️ Configuration Options

### Database Settings

| Option | Default | Description |
|--------|---------|-------------|
| `db_password` | `secure_password_123` | Database password |

### MQTT Settings

| Option | Default | Description |
|--------|---------|-------------|
| `mqtt_username` | `gym_mqtt_user` | MQTT broker username |
| `mqtt_password` | `mqtt_password_123` | MQTT broker password |
| `mqtt_client_id` | `gym-admin-ha-addon` | MQTT client ID |
| `mqtt_websocket_port` | `9001` | MQTT WebSocket port |
| `mqtt_allow_anonymous` | `true` | Allow anonymous MQTT connections |
| `mqtt_max_connections` | `100` | Maximum MQTT connections |
| `mqtt_max_message_size` | `1024` | Maximum MQTT message size |

### System Settings

| Option | Default | Description |
|--------|---------|-------------|
| `system_auto_refresh` | `30` | Auto-refresh interval (seconds) |
| `system_data_retention_days` | `90` | Data retention period (days) |
| `system_backup_enabled` | `true` | Enable automatic backups |
| `system_debug_mode` | `false` | Enable debug logging |

### Security Settings

| Option | Default | Description |
|--------|---------|-------------|
| `security_session_timeout` | `30` | Session timeout (minutes) |
| `security_password_policy` | `standard` | Password policy (standard/strong/enterprise) |
| `security_two_factor_auth` | `false` | Enable two-factor authentication |
| `security_audit_logging` | `true` | Enable audit logging |

## 🔧 Advanced Configuration

### Example Configuration

```json
{
  "db_password": "your_secure_database_password",
  "mqtt_username": "gym_mqtt_user",
  "mqtt_password": "your_secure_mqtt_password",
  "mqtt_client_id": "gym-admin-ha-addon",
  "mqtt_websocket_port": 9001,
  "mqtt_allow_anonymous": false,
  "mqtt_max_connections": 200,
  "mqtt_max_message_size": 2048,
  "system_auto_refresh": 15,
  "system_data_retention_days": 180,
  "system_backup_enabled": true,
  "system_debug_mode": false,
  "security_session_timeout": 20,
  "security_password_policy": "strong",
  "security_two_factor_auth": false,
  "security_audit_logging": true
}
```

### Security Recommendations

1. **Change Default Passwords**:
   ```json
   {
     "db_password": "your_very_secure_database_password",
     "mqtt_password": "your_very_secure_mqtt_password"
   }
   ```

2. **Disable Anonymous MQTT**:
   ```json
   {
     "mqtt_allow_anonymous": false
   }
   ```

3. **Use Strong Password Policy**:
   ```json
   {
     "security_password_policy": "strong"
   }
   ```

## 📊 Service Information

### Ports Used

| Port | Service | Description |
|------|---------|-------------|
| `3001` | Web Interface | Gym locker dashboard |
| `1883` | MQTT Broker | MQTT protocol |
| `9001` | MQTT WebSocket | MQTT over WebSocket |
| `3306` | Database | MariaDB (optional external access) |

### Internal Services

The addon runs these services internally:

1. **MariaDB Database**:
   - Host: `localhost`
   - Port: `3306`
   - Database: `gym_lockers`
   - User: `gym_admin`

2. **Mosquitto MQTT Broker**:
   - Host: `localhost`
   - Port: `1883`
   - WebSocket: `9001`

3. **Node.js Application**:
   - Web interface on port `3001`
   - Connects to internal database and MQTT

## 🔍 Monitoring and Logs

### View Logs in Home Assistant

1. Go to **Settings** → **Add-ons**
2. Find **"Gym Locker Admin Dashboard - All-in-One"**
3. Click **Logs** tab

### Service Status

The addon shows the status of all services:
- ✅ **Database**: MariaDB connection
- ✅ **MQTT**: Mosquitto broker
- ✅ **Application**: Node.js web server

### Health Checks

The addon automatically performs health checks:
- Database connectivity
- MQTT broker status
- Web interface availability

## 🔄 Backup and Restore

### Automatic Backups

The addon integrates with Home Assistant's backup system:
- Database data is stored in `/data/db`
- MQTT data is stored in `/data/mqtt`
- Application data is stored in `/data/app`

### Manual Backup

To create a manual backup:

1. Go to **Settings** → **System** → **Backups**
2. Click **Create Backup**
3. The addon data will be included automatically

### Restore

To restore from backup:

1. Go to **Settings** → **System** → **Backups**
2. Select your backup
3. Click **Restore**
4. The addon will be restored with all data

## 🛠️ Troubleshooting

### Common Issues

#### Addon Won't Start

1. **Check Logs**: View addon logs for error messages
2. **Check Configuration**: Verify all configuration values are valid
3. **Check Resources**: Ensure Home Assistant has enough resources
4. **Restart Addon**: Try stopping and starting the addon

#### Database Connection Issues

1. **Check Database Logs**: Look for MariaDB errors
2. **Verify Configuration**: Check database password settings
3. **Restart Addon**: Database will reinitialize if needed

#### MQTT Connection Issues

1. **Check MQTT Logs**: Look for Mosquitto errors
2. **Verify Credentials**: Check MQTT username/password
3. **Test Connection**: Use the dashboard's MQTT test feature

#### Web Interface Not Accessible

1. **Check Application Logs**: Look for Node.js errors
2. **Verify Port**: Ensure port 3001 is not blocked
3. **Try Ingress**: Access via Home Assistant ingress URL

### Debug Mode

Enable debug mode for detailed logging:

```json
{
  "system_debug_mode": true
}
```

### Reset to Defaults

To reset the addon to default settings:

1. Stop the addon
2. Go to **Configuration** tab
3. Click **Reset to defaults**
4. Start the addon

## 🔗 Integration with Home Assistant

### MQTT Integration

The addon's MQTT broker can be used by other Home Assistant addons:

```yaml
# In other addon configurations
mqtt:
  broker: localhost
  port: 1883
  username: gym_mqtt_user
  password: your_mqtt_password
```

### Database Access

The database can be accessed by other addons if needed:

```yaml
# Database connection for other addons
database:
  host: localhost
  port: 3306
  database: gym_lockers
  username: gym_admin
  password: your_database_password
```

## 📈 Performance Optimization

### Resource Requirements

| Component | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| MariaDB | 0.5 cores | 512MB | 1GB |
| Mosquitto | 0.2 cores | 256MB | 100MB |
| Node.js App | 1.0 cores | 1GB | 500MB |
| **Total** | **1.7 cores** | **1.8GB** | **1.6GB** |

### Optimization Tips

1. **For Small Installations** (< 50 lockers):
   ```json
   {
     "mqtt_max_connections": 50,
     "system_auto_refresh": 30
   }
   ```

2. **For Medium Installations** (50-200 lockers):
   ```json
   {
     "mqtt_max_connections": 200,
     "system_auto_refresh": 15
   }
   ```

3. **For Large Installations** (> 200 lockers):
   ```json
   {
     "mqtt_max_connections": 500,
     "system_auto_refresh": 10
   }
   ```

## 🎯 Success Criteria

After installation, you should have:

- ✅ **Web Interface**: Accessible at `http://[HA_HOST]:3001`
- ✅ **MQTT Broker**: Running on port 1883
- ✅ **Database**: MariaDB running internally
- ✅ **No External Dependencies**: Everything self-contained
- ✅ **Home Assistant Integration**: Native addon benefits

## 📞 Support

### Getting Help

1. **Check Logs**: Review addon logs for errors
2. **Documentation**: Refer to this guide
3. **GitHub Issues**: Report issues on GitHub
4. **Community**: Ask in Home Assistant community

### Useful Commands

```bash
# Check addon status
ha addons info gym_locker_dashboard_all_in_one

# View addon logs
ha addons logs gym_locker_dashboard_all_in_one

# Restart addon
ha addons restart gym_locker_dashboard_all_in_one
```

This all-in-one Home Assistant addon provides a complete, self-contained gym locker management solution with no external dependencies required. 