# 🏋️‍♂️ Gym Locker Management System

A comprehensive management system for gym lockers with MQTT support, real-time monitoring, and automated locker assignment.

## ✨ Features

- **🔐 Smart Locker Management**: RFID-based auto-assignment and unlocking
- **📱 Modern Web Dashboard**: React-based admin interface with real-time updates
- **📡 MQTT Integration**: Real-time communication for locker status and control
- **👥 User Management**: Member profiles, group management, and access control
- **📊 Analytics & Reporting**: Usage statistics, activity logs, and insights
- **🔄 Auto-Discovery**: Automatic locker detection and configuration
- **💓 Heartbeat Monitoring**: Real-time health checks for all connected devices
- **🔧 Flexible Configuration**: Support for both internal and external MQTT brokers

## 🚀 Quick Start

### Option 1: Docker All-in-One (Recommended)

```bash
# Build and run the complete system
docker build -t gym-lockers -f addons/gym_lockers/Dockerfile .
docker run -d --name gym-lockers -p 3001:3001 -p 1883:1883 -p 9001:9001 gym-lockers
```

Access the dashboard at: http://localhost:3001

### Option 2: Local Development

```bash
# Install dependencies
cd gym_lockers
npm run install-all

# Start development servers
npm run dev          # Both backend and frontend
npm run server       # Backend only
npm run client       # Frontend only
```

### Option 3: Home Assistant Add-on

1. Add this repository to Home Assistant
2. Install the "Gym Lockers Management System" add-on
3. Configure your settings and start the add-on

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │  MariaDB/MySQL  │
│   (Port 3001)   │◄──►│   (Express)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  MQTT Broker    │
                       │   (Mosquitto)   │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Locker Devices │
                       │   (RFID, etc.)  │
                       └─────────────────┘
```

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **Database**: MariaDB/MySQL 10.x or higher
- **MQTT Broker**: Mosquitto (included in Docker setup)
- **Docker**: 20.x or higher (for containerized deployment)

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gym_lockers
DB_USER=gym_admin
DB_PASSWORD=your_password

# MQTT Configuration
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

### Configuration Files

- `gym_lockers/config.js` - Main configuration loader
- `gym_lockers/local-config.json` - Local development settings
- `addon.yaml` - Home Assistant add-on configuration

## 📚 API Endpoints

### Core Endpoints

- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/lockers` - List all lockers
- `POST /api/lockers/assign` - Assign locker to user
- `GET /api/analytics` - Get usage statistics
- `GET /api/heartbeat` - System health status

### MQTT Topics

- `gym/lockers/+/status` - Locker status updates
- `gym/lockers/+/rfid` - RFID card scans
- `gym/lockers/+/command` - Locker control commands
- `gym/system/heartbeat` - System health monitoring

## 🐳 Docker Deployment

### Build the Image

```bash
docker build -t gym-lockers -f addons/gym_lockers/Dockerfile .
```

### Run the Container

```bash
docker run -d \
  --name gym-lockers \
  -p 3001:3001 \
  -p 1883:1883 \
  -p 9001:9001 \
  -v gym-lockers-data:/data \
  gym-lockers
```

### Ports

- **3001**: Web dashboard
- **1883**: MQTT broker
- **9001**: MQTT WebSocket

## 🏠 Home Assistant Integration

### Repository Setup

```yaml
# Add to Home Assistant repositories
repositories:
  - https://github.com/Solace-Software/lockers
```

### Add-on Configuration

```yaml
database:
  host: ""  # Leave empty for internal database
  port: 3306
  name: "gym_lockers"
  username: ""
  password: ""

mqtt:
  use_internal: true  # Use built-in MQTT broker
  external:
    host: ""
    port: 1883
    username: ""
    password: ""

system:
  auto_refresh: 30
  data_retention: 90
  debug_mode: false
```

## 🛠️ Development

### Project Structure

```
gym_lockers/
├── client/           # React frontend
├── src/             # Backend source code
├── routes/          # API route handlers
├── database.js      # Database connection & schema
├── server.js        # Main application logic
└── config.js        # Configuration management
```

### Available Scripts

```bash
npm run dev          # Start both backend and frontend
npm run server       # Start backend server
npm run client       # Start React development server
npm run build        # Build production frontend
npm run install-all  # Install all dependencies
npm run cleanup      # Clean up port conflicts
```

### Database Schema

The system automatically creates the following tables:
- `users` - User profiles and access control
- `lockers` - Locker information and status
- `groups` - User group management
- `settings` - System configuration
- `logs` - Activity and access logs
- `mqtt_messages` - MQTT communication history

## 🔒 Security Features

- **RFID Authentication**: Secure card-based access
- **User Permissions**: Role-based access control
- **Activity Logging**: Comprehensive audit trail
- **MQTT Security**: Username/password authentication
- **Database Security**: Prepared statements and input validation

## 📊 Monitoring & Analytics

- **Real-time Dashboard**: Live locker status and user activity
- **Usage Statistics**: Peak hours, popular lockers, user patterns
- **System Health**: MQTT connectivity, database status, device heartbeats
- **Activity Logs**: Detailed records of all system interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [DOCS.md](addons/gym_lockers/DOCS.md) file
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Join the community discussions

## 🏷️ Version

**Current Version**: 2.0.0

---

**Built with ❤️ by Solace Software**
