# Local Development Setup

This guide explains how to run the Gym Locker Dashboard locally for development.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Docker** (for MariaDB and MQTT)
3. **Git**

## Quick Start

### 1. Start Required Services

```bash
# Start MariaDB database
docker run --name gym-lockers-db -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=gym_lockers -e MYSQL_USER=solace -e MYSQL_PASSWORD=solace123 -p 3306:3306 -d mariadb:latest

# Start MQTT broker
docker run --name gym-mqtt-broker -p 1883:1883 -p 9001:9001 -d eclipse-mosquitto:latest
```

### 2. Configure Local Settings

Update `local-config.json` with your database settings:

```json
{
  "db_host": "localhost",
  "db_port": 3306,
  "db_user": "solace",
  "db_password": "solace123",
  "db_name": "gym_lockers"
}
```

### 3. Start the Application

```bash
# Install dependencies
npm install

# Build client and start server
npm run local
```

## Development Workflow

### Branch Strategy
- **`main`**: Home Assistant addon version
- **`local-development`**: Local development version

### Running Locally
```bash
# Switch to local development branch
git checkout local-development

# Start the application
npm run local
```

### Running as Addon
```bash
# Switch to main branch
git checkout main

# Start the addon
npm start
```

## Differences Between Local and Addon

| Feature | Local Development | Home Assistant Addon |
|---------|------------------|---------------------|
| Configuration | `local-config.json` | `/data/options.json` |
| Database | Local MariaDB container | Home Assistant MariaDB addon |
| MQTT | Local Mosquitto container | Home Assistant MQTT addon |
| Web Interface | Built and served locally | Built and served by addon |
| Port | 3001 | 3001 (configured by HA) |

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run test-db
```

### MQTT Connection Issues
```bash
# Check if MQTT broker is running
docker ps | grep gym-mqtt-broker
```

### Web Interface Not Loading
```bash
# Rebuild client
cd client && npm run build
```

## API Endpoints

- **Status**: `http://localhost:3001/api/status`
- **Settings**: `http://localhost:3001/api/settings`
- **Lockers**: `http://localhost:3001/api/lockers`
- **Users**: `http://localhost:3001/api/users`

## MQTT Topics

- **RFID Scans**: `locker/rfid/scan`
- **Status Updates**: `locker/status/update`
- **Heartbeat**: `locker/heartbeat`

## Development Tips

1. **Hot Reload**: The client will rebuild automatically when you run `npm run local`
2. **Database**: Use `npm run setup` to configure database settings
3. **Testing**: Use `npm run test-db` to verify database connectivity
4. **MQTT Testing**: Use the MQTT listener in the Settings page to test messages 