# Gym Locker Management System - Home Assistant Addon

A comprehensive gym locker management system with RFID integration, real-time monitoring, and automatic locker assignment capabilities.

## Features

- **RFID Integration**: Automatic locker assignment based on RFID card scans
- **Real-time Monitoring**: Live updates via WebSocket connections
- **MQTT Support**: Integration with IoT devices and Home Assistant MQTT broker
- **Database Management**: PostgreSQL or SQLite support with automatic fallback
- **Web Interface**: Modern React-based dashboard for locker management
- **User Management**: Track locker assignments and usage patterns
- **Settings Management**: Configure MQTT, database, and system settings

## Installation

1. Add this repository to your Home Assistant addon store
2. Install the "Gym Locker Management System" addon
3. Configure the addon options (see Configuration section below)
4. Start the addon

## Configuration

### Basic Options

- **database_url**: Database connection string (optional, defaults to SQLite)
- **mqtt_host**: MQTT broker hostname (default: localhost)
- **mqtt_port**: MQTT broker port (default: 1883)
- **mqtt_username**: MQTT username (optional)
- **mqtt_password**: MQTT password (optional)
- **use_internal_mqtt**: Use Home Assistant's internal MQTT broker (default: true)
- **log_level**: Logging level (debug, info, warning, error)

### Example Configuration

```yaml
database_url: "postgres://user:password@addon_postgres:5432/lockers"
mqtt_host: "core-mosquitto"
mqtt_port: 1883
mqtt_username: ""
mqtt_password: ""
use_internal_mqtt: true
log_level: "info"
```

## Usage

1. Access the web interface at `http://homeassistant.local:3001`
2. Configure your MQTT settings in the Settings page
3. Set up your lockers in the Lockers management section
4. Register users and their RFID cards
5. Monitor locker usage in real-time

## MQTT Topics

The system uses the following MQTT topics:

- `rfid/scan` - RFID card scan events
- `locker/{id}/unlock` - Unlock specific locker
- `locker/{id}/status` - Locker status updates
- `test/connection` - Test MQTT connectivity

## Hardware Requirements

- RFID reader compatible with your RFID cards
- Electronic door locks controllable via MQTT
- Network connectivity for MQTT communication

## Support

For issues, feature requests, or contributions, please visit the [GitHub repository](https://github.com/Solace-Software/lockers).

## License

This project is licensed under the MIT License.