# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-01-01

### Added
- Initial release of Gym Locker Management System
- RFID-based automatic locker assignment
- Real-time web dashboard with React frontend
- MQTT integration for IoT device communication
- PostgreSQL and SQLite database support with automatic fallback
- User and locker management interface
- Settings configuration for MQTT and database
- Live MQTT message monitoring and subscription management
- Socket.IO for real-time updates
- Memory-based storage fallback when database unavailable
- Professional logging without emoji indicators
- Home Assistant addon compatibility

### Features
- **Frontend**: Modern React-based dashboard
- **Backend**: Node.js server with Express framework
- **Database**: PostgreSQL primary with SQLite fallback
- **MQTT**: Built-in broker support and external broker connectivity
- **Real-time**: WebSocket connections for live updates
- **Storage**: Automatic fallback to in-memory storage
- **Configuration**: Web-based settings management

### Technical Details
- Multi-architecture Docker support (armhf, armv7, aarch64, amd64, i386)
- Automatic locker assignment based on availability and user preferences
- RFID scan processing with configurable delay timers
- Comprehensive error handling and logging
- Production-ready configuration management