# All-in-One Deployment Guide

This guide shows how to deploy the Gym Locker Admin Dashboard with MQTT broker and database all in one container or stack.

## 🎯 Overview

There are three main approaches to create an all-in-one deployment:

1. **Docker Compose Stack** (Recommended)
2. **Single Container with Multiple Services**
3. **Home Assistant Addon All-in-One**

## 🐳 Approach 1: Docker Compose Stack

### Benefits
- ✅ **Easy to manage**: Separate services but orchestrated together
- ✅ **Scalable**: Can easily add more services
- ✅ **Maintainable**: Each service can be updated independently
- ✅ **Resource efficient**: Better resource isolation

### Deployment

```bash
# 1. Create the stack
docker-compose -f docker-compose-all-in-one.yml up -d

# 2. Check status
docker-compose -f docker-compose-all-in-one.yml ps

# 3. View logs
docker-compose -f docker-compose-all-in-one.yml logs -f
```

### Configuration

The stack includes:
- **MariaDB**: Database service
- **Mosquitto**: MQTT broker service  
- **Gym Locker Dashboard**: Main application

All services communicate via internal Docker network.

### Environment Variables

```yaml
# Database (internal)
DB_HOST=localhost
DB_PORT=3306
DB_USER=gym_admin
DB_PASSWORD=secure_password_123
DB_NAME=gym_lockers

# MQTT (internal)
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=gym_mqtt_user
MQTT_PASSWORD=mqtt_password_123
MQTT_CLIENT_ID=gym-admin-all-in-one
```

## 🐳 Approach 2: Single Container with Multiple Services

### Benefits
- ✅ **True all-in-one**: Everything in one container
- ✅ **Simple deployment**: Single container to manage
- ✅ **Portable**: Easy to move between environments
- ✅ **Resource sharing**: Services can share resources

### Deployment

```bash
# 1. Build the all-in-one image
docker build -f Dockerfile.all-in-one -t gym-locker-all-in-one .

# 2. Run the container
docker run -d \
  --name gym-locker-all-in-one \
  -p 3001:3001 \
  -p 1883:1883 \
  -p 9001:9001 \
  -p 3306:3306 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/db-data:/var/lib/mysql \
  -v $(pwd)/mqtt-data:/mosquitto/data \
  -v $(pwd)/mqtt-logs:/mosquitto/log \
  gym-locker-all-in-one
```

### Services in Container

The container runs:
- **MariaDB**: Database server
- **Mosquitto**: MQTT broker
- **Node.js App**: Gym locker dashboard
- **Supervisor**: Process manager

### Supervisor Configuration

```ini
[program:mariadb]
command=/usr/bin/mysqld_safe
priority=100

[program:mosquitto]
command=/usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf
priority=200

[program:gym-locker-app]
command=/usr/bin/node /app/server.js
priority=300
```

## 🏠 Approach 3: Home Assistant Addon All-in-One

### Benefits
- ✅ **Home Assistant Integration**: Native HA addon
- ✅ **Easy Configuration**: HA addon configuration interface
- ✅ **Automatic Updates**: HA addon update system
- ✅ **Backup Integration**: HA backup system

### Configuration

```json
{
  "name": "Gym Locker Admin Dashboard - All-in-One",
  "slug": "gym_locker_dashboard_all_in_one",
  "ports": {
    "3001/tcp": 3001,
    "1883/tcp": 1883,
    "9001/tcp": 9001,
    "3306/tcp": 3306
  }
}
```

### Installation

1. Add the repository to Home Assistant
2. Install the "Gym Locker Dashboard - All-in-One" addon
3. Configure settings in the addon configuration
4. Start the addon

## 🔧 Configuration Options

### Database Configuration

```yaml
# Internal database (recommended for all-in-one)
DB_HOST=localhost
DB_PORT=3306
DB_USER=gym_admin
DB_PASSWORD=secure_password_123
DB_NAME=gym_lockers
```

### MQTT Configuration

```yaml
# Internal MQTT broker
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=gym_mqtt_user
MQTT_PASSWORD=mqtt_password_123
MQTT_CLIENT_ID=gym-admin-all-in-one
```

### System Configuration

```yaml
# System settings
SYSTEM_AUTO_REFRESH=30
SYSTEM_DATA_RETENTION_DAYS=90
SYSTEM_BACKUP_ENABLED=true
SYSTEM_DEBUG_MODE=false
```

## 📊 Performance Considerations

### Resource Requirements

| Component | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| MariaDB | 0.5 cores | 512MB | 1GB |
| Mosquitto | 0.2 cores | 256MB | 100MB |
| Node.js App | 1.0 cores | 1GB | 500MB |
| **Total** | **1.7 cores** | **1.8GB** | **1.6GB** |

### Optimization Tips

1. **Database Optimization**:
   ```sql
   SET GLOBAL innodb_buffer_pool_size = 256M;
   SET GLOBAL innodb_log_file_size = 64M;
   ```

2. **MQTT Optimization**:
   ```conf
   max_connections 100
   max_queued_messages 100
   persistence true
   ```

3. **Application Optimization**:
   ```javascript
   // Connection pooling
   const pool = mysql.createPool({
     connectionLimit: 10,
     // ... other settings
   });
   ```

## 🔒 Security Considerations

### Database Security

```sql
-- Create dedicated user
CREATE USER 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON gym_lockers.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;
```

### MQTT Security

```conf
# mosquitto.conf
allow_anonymous false
password_file /mosquitto/config/passwd
acl_file /mosquitto/config/acl
```

### Network Security

```yaml
# Docker Compose network isolation
networks:
  gym-network:
    driver: bridge
    internal: true  # No external access
```

## 🔄 Backup and Recovery

### Automated Backup

```bash
#!/bin/bash
# Backup script for all-in-one deployment

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
mysqldump -h localhost -u gym_admin -psecure_password_123 gym_lockers > $BACKUP_DIR/db_$DATE.sql

# MQTT data backup
tar -czf $BACKUP_DIR/mqtt_$DATE.tar.gz /mosquitto/data

# Application data backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /app/data

# Create combined backup
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz \
  $BACKUP_DIR/db_$DATE.sql \
  $BACKUP_DIR/mqtt_$DATE.tar.gz \
  $BACKUP_DIR/app_$DATE.tar.gz
```

### Recovery

```bash
# Restore from backup
tar -xzf full_backup_20240115_120000.tar.gz
mysql -h localhost -u gym_admin -psecure_password_123 gym_lockers < db_20240115_120000.sql
tar -xzf mqtt_20240115_120000.tar.gz -C /
tar -xzf app_20240115_120000.tar.gz -C /
```

## 🚀 Deployment Scripts

### Quick Start Script

```bash
#!/bin/bash
# quick-start.sh

echo "🚀 Starting Gym Locker All-in-One Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
mkdir -p data db-data mqtt-data mqtt-logs mqtt-config

# Build and start the stack
docker-compose -f docker-compose-all-in-one.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose-all-in-one.yml ps

echo "✅ Deployment complete!"
echo "🌐 Web Interface: http://localhost:3001"
echo "📡 MQTT Broker: localhost:1883"
echo "🗄️ Database: localhost:3306"
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "🔍 Checking service health..."

# Check web interface
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Web interface is running"
else
    echo "❌ Web interface is not responding"
fi

# Check MQTT broker
if mosquitto_pub -h localhost -p 1883 -t test/health -m "test" > /dev/null 2>&1; then
    echo "✅ MQTT broker is running"
else
    echo "❌ MQTT broker is not responding"
fi

# Check database
if mysql -h localhost -u gym_admin -psecure_password_123 -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database is running"
else
    echo "❌ Database is not responding"
fi
```

## 📋 Comparison of Approaches

| Feature | Docker Compose | Single Container | HA Addon |
|---------|----------------|------------------|----------|
| **Complexity** | Medium | High | Low |
| **Maintainability** | High | Medium | High |
| **Resource Efficiency** | High | Medium | High |
| **Scalability** | High | Low | Medium |
| **Portability** | High | High | Low |
| **Home Assistant Integration** | Low | Low | High |

## 🎯 Recommendation

### For Development/Testing
Use **Docker Compose** approach - easier to debug and modify.

### For Production Deployment
Use **Docker Compose** approach - better resource management and scalability.

### For Home Assistant Users
Use **Home Assistant Addon** approach - seamless integration with HA ecosystem.

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :1883
   ```

2. **Permission Issues**:
   ```bash
   # Fix volume permissions
   sudo chown -R 1000:1000 data/
   sudo chown -R 999:999 db-data/
   ```

3. **Service Startup Order**:
   ```yaml
   # Add depends_on to ensure proper startup order
   depends_on:
     - mariadb
     - mosquitto
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose -f docker-compose-all-in-one.yml logs -f

# View specific service logs
docker-compose -f docker-compose-all-in-one.yml logs -f mariadb
docker-compose -f docker-compose-all-in-one.yml logs -f mosquitto
docker-compose -f docker-compose-all-in-one.yml logs -f gym-locker-system
```

This all-in-one deployment approach provides a complete, self-contained solution that's easy to deploy and manage while maintaining good performance and security practices. 