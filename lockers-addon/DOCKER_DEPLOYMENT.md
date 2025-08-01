# Docker Deployment Guide

This guide shows how to run the Gym Locker Dashboard as a standalone Docker container with all dependencies.

## 🐳 Quick Start

### Prerequisites
- Docker installed
- Docker Compose installed
- Git (to clone the repository)

### Option 1: Automated Setup
```bash
# Clone the repository
git clone https://github.com/Solace-Software/lockers.git
cd lockers/lockers-addon

# Run the startup script
./start-docker.sh
```

### Option 2: Manual Setup
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📋 Services Included

### 1. **MariaDB Database**
- **Container**: `gym-lockers-db`
- **Port**: `3306`
- **Database**: `gym_lockers`
- **User**: `solace`
- **Password**: `solace123`

### 2. **Mosquitto MQTT Broker**
- **Container**: `gym-lockers-mqtt`
- **Port**: `1884` (MQTT), `9002` (WebSocket)
- **Configuration**: `mosquitto.conf`
- **Authentication**: Anonymous (for development)

### 3. **Gym Locker Dashboard**
- **Container**: `gym-locker-dashboard`
- **Port**: `3002`
- **Web UI**: http://localhost:3002
- **Environment**: Pre-configured for Docker

## 🔧 Configuration

### Environment Variables
The dashboard is pre-configured with these environment variables:
```bash
DB_HOST=mariadb
DB_PORT=3306
DB_USER=solace
DB_PASSWORD=solace123
DB_NAME=gym_lockers
MQTT_HOST=mosquitto
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=gym-admin-docker
```

### Custom Configuration
To modify the configuration:

1. **Edit docker-compose.yml**:
   ```yaml
   environment:
     - DB_HOST=your-db-host
     - MQTT_HOST=your-mqtt-host
   ```

2. **Or use environment file**:
   ```bash
   # Create .env file
   DB_HOST=mariadb
   MQTT_HOST=mosquitto
   # ... other variables
   ```

## 📊 Access Points

### Web Dashboard
- **URL**: http://localhost:3002
- **Features**: Full locker management interface

### Database
- **Host**: localhost
- **Port**: 3306
- **Database**: gym_lockers
- **Credentials**: solace/solace123

### MQTT Broker
- **Host**: localhost
- **Port**: 1884
- **WebSocket**: localhost:9002
- **Topics**: All locker-related topics

## 🛠️ Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f gym-locker-dashboard
```

### Restart Services
```bash
docker-compose restart
```

### Update and Rebuild
```bash
docker-compose pull
docker-compose up --build -d
```

### Clean Up (Remove Data)
```bash
docker-compose down -v
```

## 🔍 Troubleshooting

### Check Service Status
```bash
docker-compose ps
```

### Check Individual Container Logs
```bash
# Dashboard
docker logs gym-locker-dashboard

# Database
docker logs gym-lockers-db

# MQTT
docker logs gym-lockers-mqtt
```

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3001
lsof -i :3306
lsof -i :1883

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Issues
```bash
# Check if database is ready
docker exec gym-lockers-db mysql -u solace -psolace123 -e "SHOW DATABASES;"
```

#### 3. MQTT Connection Issues
```bash
# Test MQTT connection
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "test message"
```

## 🔒 Security Considerations

### For Production Use
1. **Change default passwords** in docker-compose.yml
2. **Enable MQTT authentication** in mosquitto.conf
3. **Use SSL/TLS** for database and MQTT connections
4. **Restrict network access** as needed
5. **Use secrets management** for sensitive data

### Example Production Configuration
```yaml
environment:
  - DB_PASSWORD=${DB_PASSWORD}
  - MQTT_PASSWORD=${MQTT_PASSWORD}
```

## 📁 Data Persistence

### Volumes
- **Database**: `mariadb_data` - MariaDB data
- **MQTT**: `mosquitto_data` - MQTT persistence
- **Logs**: `mosquitto_logs` - MQTT logs
- **App Data**: `./data:/app/data` - Dashboard data

### Backup
```bash
# Backup database
docker exec gym-lockers-db mysqldump -u solace -psolace123 gym_lockers > backup.sql

# Backup MQTT data
docker cp gym-lockers-mqtt:/mosquitto/data ./mqtt-backup
```

## 🚀 Performance Optimization

### Resource Limits
Add to docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

### Scaling
```bash
# Scale dashboard (if needed)
docker-compose up -d --scale gym-locker-dashboard=2
```

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify network connectivity between containers
3. Ensure all required ports are available
4. Check the GitHub repository for updates 