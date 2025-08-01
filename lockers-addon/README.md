# Gym Locker Admin Dashboard

A comprehensive locker management system with MQTT integration for gym facilities.

## Version History

### v1.1.3 (Latest)
- **Fixed Docker container networking**: Added proper Home Assistant container name resolution
- **Fixed MQTT connection issues**: Updated configuration to use core-mosquitto instead of localhost
- **Fixed database connection issues**: Updated configuration to use core-mariadb instead of localhost
- **Added HA-specific configuration**: Created ha-config.json for Home Assistant environment
- **Improved container communication**: Better integration with Home Assistant addon ecosystem

### v1.1.2
- **Fixed 503 Service Unavailable error**: Fixed static file serving and React app routing
- **Improved Docker container compatibility**: Fixed client_build vs client/build path issues
- **Enhanced static file serving**: Added support for both development and production paths
- **Better error handling**: Added proper fallbacks for missing frontend files

### v1.1.1
- **Fixed Home Assistant addon web UI access**: Enabled ingress and proper routing
- **Improved addon integration**: Better Home Assistant compatibility
- **Fixed web UI URL format**: Added proper trailing slash and ingress entry
- **Enhanced deployment**: Streamlined installation process

### v1.1.0
- **Fixed MQTT message flood issue**: Changed from wildcard subscription (`#`) to specific topic subscriptions
- **Added message filtering**: Implemented topic-based filtering to prevent processing irrelevant messages
- **Added message size limits**: Prevent processing of large messages (like image data) that could cause memory issues
- **Improved stability**: Server no longer crashes from overwhelming MQTT traffic
- **Enhanced performance**: Reduced memory usage and improved response times

### v1.0.0
- Initial release with basic locker management functionality
- MQTT integration for real-time updates
- RFID tag management and user assignment
- Web-based dashboard interface

## Features

- Real-time locker monitoring via MQTT
- RFID tag management and user assignment
- Locker group management
- Activity logging and analytics
- Web-based dashboard interface

## Database Configuration

The addon requires a MariaDB/MySQL database. You can configure the database connection in several ways:

### Option 1: Home Assistant Addon Configuration (Recommended)

When running as a Home Assistant addon, configure the database settings in the addon configuration:

```json
{
  "db_host": "ccore-mariadb",
  "db_port": 3306,
  "db_user": "your_user",
  "db_password": "your_password",
  "db_name": "gym_lockers"
}
```

### Option 2: Local Configuration File

For development or standalone use, create a `local-config.json` file:

```json
{
  "db_host": "localhost",
  "db_port": 3306,
  "db_user": "root",
  "db_password": "your_password",
  "db_name": "gym_lockers"
}
```

### Option 3: Environment Variables

Set the following environment variables:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gym_lockers
```

### Option 4: Interactive Setup

Run the setup script to configure the database interactively:

```bash
node setup-database.js
```

## Quick Start

1. **Configure Database**: Use one of the configuration methods above
2. **Install Dependencies**: `npm install`
3. **Start Server**: `node server.js` or `node start-server.js`

## Database Schema

The addon will automatically create the following tables:
- `users` - User management
- `lockers` - Locker information
- `groups` - Locker groups
- `group_lockers` - Group-locker relationships
- `settings` - System settings
- `activity_logs` - Activity tracking
- `mqtt_messages` - MQTT message history

## MQTT Integration

The addon connects to an MQTT broker to receive real-time updates from locker controllers. Configure MQTT settings through the web interface or API.

## API Endpoints

- `GET /api/lockers` - List all lockers
- `GET /api/users` - List all users
- `POST /api/lockers/:id/assign` - Assign locker to user
- `POST /api/lockers/:id/unassign` - Unassign locker
- `GET /api/settings` - Get system settings
- `POST /api/settings` - Update system settings

## Troubleshooting

### Database Connection Issues

1. Verify database credentials in configuration
2. Ensure MariaDB/MySQL is running
3. Check network connectivity to database host
4. Verify database exists and user has proper permissions

### MQTT Connection Issues

1. Check MQTT broker configuration
2. Verify network connectivity to MQTT broker
3. Check MQTT credentials if authentication is enabled

## Development

For development, the addon can be run standalone with:

```bash
npm install
node setup-database.js  # Configure database
node server.js          # Start server
```

The web interface will be available at `http://localhost:3001` 