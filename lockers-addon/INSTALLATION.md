# Home Assistant Addon Installation Guide

## Version 1.1.0 Update

This update includes critical MQTT stability improvements that prevent server crashes from message floods.

### What's New in v1.1.0
- **Fixed MQTT message flood issue**: Changed from wildcard subscription (`#`) to specific topic subscriptions
- **Added message filtering**: Implemented topic-based filtering to prevent processing irrelevant messages
- **Added message size limits**: Prevent processing of large messages (like image data) that could cause memory issues
- **Improved stability**: Server no longer crashes from overwhelming MQTT traffic
- **Enhanced performance**: Reduced memory usage and improved response times

## Installation Steps

### Option 1: Upload via Home Assistant UI (Recommended)

1. **Download the addon archive**: `gym-locker-dashboard-1.1.0.tar.gz`
2. **Go to Home Assistant**: Navigate to Settings → Add-ons → Add-on Store
3. **Upload the archive**: Click the three dots menu → "Upload Add-on"
4. **Select the file**: Choose `gym-locker-dashboard-1.1.0.tar.gz`
5. **Install the addon**: Click "Install" when prompted
6. **Configure the addon**: Set your database and MQTT settings
7. **Start the addon**: Click "Start"

### Option 2: Manual Installation

1. **Copy the archive** to your Home Assistant instance
2. **SSH into Home Assistant** or use the Terminal addon
3. **Navigate to addons directory**: `cd /addons/local/`
4. **Extract the archive**: `tar -xzf gym-locker-dashboard-1.1.0.tar.gz`
5. **Restart Home Assistant** or reload the addon store
6. **Install via UI**: The addon should now appear in your local addons

## Configuration

### Required Settings
- **Database Host**: `core-mariadb` (or your MariaDB instance)
- **Database Port**: `3306`
- **Database User**: Your MariaDB username
- **Database Password**: Your MariaDB password
- **Database Name**: `gym_lockers`

### MQTT Settings
- **MQTT Host**: `core-mosquitto` (or your MQTT broker)
- **MQTT Port**: `1883`
- **MQTT Username**: (optional)
- **MQTT Password**: (optional)
- **MQTT Client ID**: `gym-admin`

## Verification

After installation, verify the addon is working:

1. **Check logs**: Look for "✅ Connected to MQTT broker" and "📡 Subscribed to locker-specific topics"
2. **Access the dashboard**: Navigate to the addon URL (usually `http://your-ha-ip:3001`)
3. **Test MQTT**: Send a test message to `lockers/test` topic

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MariaDB is running
   - Check database credentials
   - Ensure database exists

2. **MQTT Connection Failed**
   - Verify Mosquitto is running
   - Check MQTT credentials
   - Ensure MQTT broker is accessible

3. **Addon Won't Start**
   - Check logs for error messages
   - Verify all required files are present
   - Ensure port 3001 is available

### Logs
Check addon logs in Home Assistant UI or via SSH:
```bash
docker logs addon_local_gym_locker_dashboard
```

## Rollback
If you need to rollback to the previous version:
1. Stop the current addon
2. Install the previous version archive
3. Restore your configuration

## Support
For issues or questions, check the logs and ensure all dependencies (MariaDB, Mosquitto) are properly configured. 