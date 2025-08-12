# Gym Locker Management System

A comprehensive gym locker management system with RFID integration and real-time monitoring.

## Features

- RFID-based automatic locker assignment
- Real-time web dashboard
- MQTT integration for IoT devices
- Database support (PostgreSQL/SQLite)
- User and locker management

## Configuration

- **database_url**: PostgreSQL connection string (optional, falls back to SQLite)
- **mqtt_host**: MQTT broker hostname
- **mqtt_port**: MQTT broker port (default: 1883)
- **mqtt_username**: MQTT authentication username (optional)
- **mqtt_password**: MQTT authentication password (optional)
- **use_internal_mqtt**: Use Home Assistant's built-in MQTT broker
- **log_level**: Logging level (debug, info, warning, error)

## Usage

1. Configure the addon options
2. Start the addon
3. Access the web interface at http://hassio.local:3001
4. Set up your lockers and users through the dashboard

## Support

For issues and feature requests, visit: https://github.com/Solace-Software/lockers