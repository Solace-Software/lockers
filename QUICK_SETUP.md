# 🚀 Quick Setup Guide

Get your Gym Lockers application deployed anywhere in under 10 minutes!

## 🎯 Choose Your Deployment Method

### Option 1: GitHub Actions (Recommended)
**Best for**: Production deployments, team collaboration, automated CI/CD

```bash
# 1. Set up GitHub repository secrets
# 2. Push to main branch
git push origin main
# 3. Watch deployment in Actions tab
```

### Option 2: Manual Script Deployment
**Best for**: Quick testing, local development, single deployments

```bash
# Deploy locally
./deployment/deploy.sh local

# Deploy to staging
./deployment/deploy.sh staging

# Deploy to production
./deployment/deploy.sh production --force-rebuild
```

### Option 3: Docker Compose (Development)
**Best for**: Local development, testing

```bash
# Start development environment
docker compose --profile dev up -d

# Start production environment
docker compose --profile prod up -d
```

## ⚡ 5-Minute GitHub Actions Setup

### Step 1: Repository Setup
```bash
# Clone and navigate to repository
git clone https://github.com/YOUR_USERNAME/lockers.git
cd lockers

# Push GitHub Actions workflows
git add .github/
git commit -m "Add GitHub Actions deployment workflows"
git push origin main
```

### Step 2: Configure Secrets
Go to GitHub → Repository → Settings → Secrets and variables → Actions

**Required Secrets:**
```
SSH_PRIVATE_KEY=<your-ssh-private-key>
SERVER_HOST=<your-server-ip>
SERVER_USER=root
DB_ROOT_PASSWORD=<secure-password>
DB_PASSWORD=<secure-password>
MQTT_USERNAME=<mqtt-username>
MQTT_PASSWORD=<mqtt-password>
DOMAIN=<your-domain.com>
```

### Step 3: Server Preparation
```bash
# On your target server
sudo mkdir -p /opt/gym-lockers
cd /opt/gym-lockers

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/YOUR_USERNAME/lockers.git .
```

### Step 4: Deploy!
```bash
# Push to main branch triggers automatic deployment
git push origin main

# Or use manual deployment in GitHub Actions tab
```

## 🎮 One-Command Local Setup

```bash
# Everything in one command
git clone https://github.com/YOUR_USERNAME/lockers.git && \
cd lockers && \
./deployment/deploy.sh local
```

**Access your application:**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database: localhost:3306

## 🌐 Production Deployment Checklist

- [ ] Server with Docker installed
- [ ] SSH key access to server
- [ ] Domain name configured (optional)
- [ ] SSL certificate (for HTTPS)
- [ ] GitHub repository secrets configured
- [ ] Environment variables set

## 🔧 Environment Examples

### Development (.env.development)
```env
DB_ROOT_PASSWORD=dev_root_password
DB_PASSWORD=dev_password
MQTT_USERNAME=dev_mqtt
MQTT_PASSWORD=dev_mqtt_password
NODE_ENV=development
DEBUG_MODE=true
```

### Production (.env.production)
```env
DB_ROOT_PASSWORD=secure_root_password_here
DB_PASSWORD=secure_app_password_here
MQTT_USERNAME=production_mqtt_user
MQTT_PASSWORD=secure_mqtt_password_here
NODE_ENV=production
DEBUG_MODE=false
DOMAIN=gym.yourcompany.com
```

## 🚨 Troubleshooting

### Common Issues:

**1. Docker not found**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**2. Permission denied**
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER /opt/gym-lockers
sudo usermod -aG docker $USER
```

**3. Port conflicts**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop nginx
```

**4. SSH connection failed**
```bash
# Test SSH connection
ssh -T user@your-server.com

# Generate SSH key if needed
ssh-keygen -t ed25519 -C "deployment@gym-lockers"
```

## 📱 Supported Platforms

| Platform | Local Dev | Staging | Production |
|----------|-----------|---------|------------|
| macOS | ✅ | ✅ | ✅ |
| Linux | ✅ | ✅ | ✅ |
| Windows (WSL2) | ✅ | ✅ | ✅ |
| Docker Desktop | ✅ | ➖ | ➖ |
| Ubuntu Server | ➖ | ✅ | ✅ |
| CentOS/RHEL | ➖ | ✅ | ✅ |

## 🎯 Next Steps

1. **Test locally**: `./deployment/deploy.sh local`
2. **Set up staging**: Configure staging secrets
3. **Deploy production**: Push to main branch
4. **Set up monitoring**: Configure health checks
5. **Enable HTTPS**: Add SSL certificates

## 📚 More Information

- [Complete Deployment Guide](DEPLOYMENT.md)
- [Docker Setup](DOCKER_SETUP.md)
- [Server Startup Guide](SERVER_STARTUP.md)

---

**Need help?** Check the troubleshooting section or open an issue!
