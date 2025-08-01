# Gym Locker Admin Dashboard

A comprehensive locker management system with MQTT integration for gym facilities.

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
  "db_host": "core-mariadb",
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