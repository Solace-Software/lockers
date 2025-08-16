# Multi-Container Docker Setup

This document describes the new multi-container Docker architecture for the Gym Lockers Management System, which provides better scalability, maintainability, and deployment flexibility compared to the previous all-in-one approach.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React Dev)   │◄──►│   (Node.js)     │◄──►│   (MariaDB)     │
│   Port 3000     │    │   Port 3001     │    │   Port 3306     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  MQTT Broker    │
                       │   (Mosquitto)   │
                       │ Ports 1883/9001 │
                       └─────────────────┘
```

## 🚀 Benefits of Multi-Container Approach

### **Development Benefits:**
- **Independent Scaling**: Each service can be scaled independently
- **Easier Debugging**: Isolated service logs and debugging
- **Technology Flexibility**: Different services can use different base images
- **Resource Management**: Better resource allocation per service

### **Production Benefits:**
- **High Availability**: Services can be deployed on different servers
- **Load Balancing**: Individual services can be load balanced
- **Security**: Better isolation between services
- **Maintenance**: Easier to update individual services

### **Deployment Benefits:**
- **Local Development**: Easy local testing with full containerization
- **Headless Server**: Simple deployment to Ubuntu servers via SSH
- **CI/CD Integration**: Better integration with deployment pipelines
- **Monitoring**: Individual service health checks and metrics

## 📁 File Structure

```
├── docker-compose.yml          # Main orchestration file
├── env.development            # Development environment variables
├── env.production             # Production environment variables
├── deploy-local.sh            # Local development script
├── deploy-production.sh       # Production deployment script
├── gym_lockers/
│   ├── Dockerfile.backend     # Backend service Dockerfile
│   └── client/
│       └── Dockerfile.frontend # Frontend service Dockerfile
├── mqtt-config/
│   └── mosquitto.conf         # MQTT broker configuration
├── nginx/
│   └── nginx.conf             # Reverse proxy configuration
└── db-init/
    └── 01-init.sql            # Database initialization script
```

## 🛠️ Services Configuration

### **1. Database Service (MariaDB)**
- **Image**: `mariadb:10.11`
- **Port**: 3306 (external access for development)
- **Volumes**: Persistent data storage
- **Health Check**: MySQL ping command
- **Initialization**: Automatic database and user creation

### **2. MQTT Broker (Mosquitto)**
- **Image**: `eclipse-mosquitto:2.0`
- **Ports**: 1883 (MQTT), 9001 (WebSocket)
- **Features**: WebSocket support, persistent storage
- **Security**: Anonymous access (configurable)
- **Health Check**: MQTT publish test

### **3. Backend Service (Node.js)**
- **Image**: Custom Alpine-based Node.js 18
- **Port**: 3001
- **Dependencies**: Waits for database and MQTT health
- **Features**: Health check endpoint, production-ready
- **Volumes**: Code mounting for development

### **4. Frontend Service (React)**
- **Image**: Custom Node.js 18 with development tools
- **Port**: 3000
- **Features**: Hot reloading, development mode
- **Profile**: Development only (not in production)

### **5. Nginx Reverse Proxy (Production)**
- **Image**: `nginx:alpine`
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Features**: SSL termination, rate limiting, caching
- **Profile**: Production only

## 🚀 Quick Start

### **Local Development**

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd lockers
   chmod +x deploy-local.sh
   ```

2. **Configure environment:**
   ```bash
   cp env.development .env
   # Edit .env with your preferences
   ```

3. **Start services:**
   ```bash
   ./deploy-local.sh
   ```

4. **Access services:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Database: localhost:3306
   - MQTT: localhost:1883

### **Production Deployment**

1. **Prepare server:**
   ```bash
   # On your Ubuntu server
   sudo apt update && sudo apt upgrade -y
   ```

2. **Copy project:**
   ```bash
   scp -r . user@server:/tmp/gym-lockers
   ```

3. **Deploy:**
   ```bash
   ssh user@server
   cd /tmp/gym-lockers
   sudo ./deploy-production.sh
   ```

## ⚙️ Configuration

### **Environment Variables**

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ROOT_PASSWORD` | MariaDB root password | `root_password` |
| `DB_NAME` | Database name | `gym_lockers` |
| `DB_USER` | Database user | `gym_admin` |
| `DB_PASSWORD` | Database password | `gym_password` |
| `MQTT_USERNAME` | MQTT username | (empty) |
| `MQTT_PASSWORD` | MQTT password | (empty) |
| `NODE_ENV` | Node.js environment | `production` |
| `DEBUG_MODE` | Enable debug mode | `false` |

### **MQTT Configuration**

The MQTT broker supports:
- **Anonymous access** (development)
- **Username/password authentication** (production)
- **WebSocket connections** for browser clients
- **Persistent message storage**
- **Configurable connection limits**

### **Database Configuration**

- **UTF8MB4 character set** for full Unicode support
- **Automatic initialization** with required tables
- **User management** with proper permissions
- **Health monitoring** and connection pooling

## 🔧 Management Commands

### **Local Development**

```bash
# Start all services
docker-compose --profile dev up -d

# View logs
docker-compose logs -f [service]

# Stop services
docker-compose down

# Restart specific service
docker-compose restart [service]

# Access service shell
docker-compose exec [service] sh
```

### **Production**

```bash
# System service management
sudo systemctl start gym-lockers
sudo systemctl stop gym-lockers
sudo systemctl status gym-lockers
sudo systemctl enable gym-lockers

# View logs
sudo journalctl -u gym-lockers -f

# Update deployment
cd /opt/gym-lockers
git pull
docker-compose --profile prod up -d
```

## 🔒 Security Features

### **Network Security**
- **Isolated network** with custom subnet
- **Service-to-service communication** only
- **External port exposure** limited to necessary services

### **Application Security**
- **Rate limiting** on API endpoints
- **Security headers** (HSTS, XSS protection)
- **SSL/TLS termination** with Nginx
- **Input validation** and sanitization

### **Database Security**
- **Separate user accounts** with minimal privileges
- **Connection encryption** support
- **Password policies** and rotation

## 📊 Monitoring & Health Checks

### **Service Health**
- **Database**: MySQL ping command
- **MQTT**: MQTT publish test
- **Backend**: HTTP health check endpoint
- **Nginx**: Built-in health check

### **Logging**
- **Structured logging** for all services
- **Centralized log collection** capability
- **Log rotation** and retention policies

### **Metrics**
- **Container resource usage** monitoring
- **Service response times** tracking
- **Error rate monitoring** and alerting

## 🚀 Deployment Scenarios

### **1. Local Development**
- **Profile**: `dev`
- **Services**: Frontend, Backend, Database, MQTT
- **Ports**: All exposed for local access
- **Volumes**: Code mounting for live development

### **2. Production Server**
- **Profile**: `prod`
- **Services**: Backend, Database, MQTT, Nginx
- **Ports**: Only 80/443 exposed
- **SSL**: Automatic certificate generation

### **3. Headless Ubuntu Server**
- **SSH Deployment**: Automated via deployment script
- **Systemd Service**: Automatic startup and management
- **SSL Certificates**: Self-signed (Let's Encrypt ready)
- **Firewall**: Minimal port exposure

## 🔄 Migration from All-in-One

### **Benefits of Migration**
1. **Better resource utilization**
2. **Easier debugging and maintenance**
3. **Production-ready architecture**
4. **Better scalability options**

### **Migration Steps**
1. **Backup existing data**
2. **Deploy new multi-container setup**
3. **Migrate data** to new database
4. **Update configuration** files
5. **Test thoroughly** before switching

## 🆘 Troubleshooting

### **Common Issues**

1. **Port conflicts**: Check if ports are already in use
2. **Database connection**: Verify database service health
3. **MQTT connectivity**: Check MQTT broker status
4. **Permission issues**: Ensure proper file permissions

### **Debug Commands**

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs [service]

# Check service health
docker-compose exec [service] healthcheck

# Access service directly
docker-compose exec [service] sh
```

## 📚 Additional Resources

- **Docker Compose**: https://docs.docker.com/compose/
- **MariaDB**: https://mariadb.org/documentation/
- **Mosquitto**: https://mosquitto.org/documentation/
- **Nginx**: https://nginx.org/en/docs/

---

**Next Steps**: 
1. Test the local development setup
2. Customize environment variables
3. Deploy to production server
4. Configure SSL certificates
5. Set up monitoring and alerting
