# 🚀 GitHub Actions Deployment Guide

This guide explains how to set up automated deployment for the Gym Lockers Management System using GitHub Actions.

## 📋 Overview

The deployment system supports:
- **Production** deployment (triggered by pushes to `main`)
- **Staging** deployment (triggered by pushes to `develop`/`staging`)
- **Manual** deployment (workflow dispatch)
- **Pull Request** preview deployments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   GitHub        │    │   Target        │
│   Repository    │───▶│   Actions       │───▶│   Server        │
│                 │    │   (CI/CD)       │    │   (Production)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Container     │
                       │   Registry      │
                       │   (GHCR)        │
                       └─────────────────┘
```

## ⚙️ Setup Instructions

### 1. Repository Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

#### Production Secrets:
```
SSH_PRIVATE_KEY          # SSH private key for production server
SERVER_HOST              # Production server IP/hostname
SERVER_USER              # SSH username (e.g., root)
DB_ROOT_PASSWORD         # MariaDB root password
DB_PASSWORD              # Application database password
MQTT_USERNAME            # MQTT broker username
MQTT_PASSWORD            # MQTT broker password
DOMAIN                   # Production domain (e.g., gym.example.com)
```

#### Staging Secrets (Optional):
```
STAGING_SSH_PRIVATE_KEY      # SSH private key for staging server
STAGING_SERVER_HOST          # Staging server IP/hostname
STAGING_SERVER_USER          # SSH username for staging
STAGING_DB_ROOT_PASSWORD     # Staging MariaDB root password
STAGING_DB_PASSWORD          # Staging database password
STAGING_MQTT_USERNAME        # Staging MQTT username
STAGING_MQTT_PASSWORD        # Staging MQTT password
STAGING_DOMAIN               # Staging domain (e.g., staging.gym.example.com)
```

### 2. SSH Key Setup

Generate SSH key pair for deployment:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/gym_lockers_deploy

# Copy public key to target server
ssh-copy-id -i ~/.ssh/gym_lockers_deploy.pub user@your-server.com

# Add private key to GitHub secrets
cat ~/.ssh/gym_lockers_deploy
# Copy this content to SSH_PRIVATE_KEY secret
```

### 3. Server Preparation

#### Production Server Setup:
```bash
# Create deployment directory
sudo mkdir -p /opt/gym-lockers
cd /opt/gym-lockers

# Clone repository
sudo git clone https://github.com/YOUR_USERNAME/lockers.git .

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose V2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Set permissions
sudo chown -R $USER:$USER /opt/gym-lockers
```

#### Staging Server Setup (if different):
```bash
# Create staging deployment directory
sudo mkdir -p /opt/gym-lockers-staging
# Follow similar steps as production
```

### 4. Environment Setup

Create environment-specific configurations:

#### Production Environment File (`/opt/gym-lockers/.env.example`):
```env
DB_ROOT_PASSWORD=your_secure_root_password
DB_NAME=gym_lockers
DB_USER=gym_admin
DB_PASSWORD=your_secure_password
MQTT_USERNAME=your_mqtt_user
MQTT_PASSWORD=your_mqtt_password
NODE_ENV=production
DEBUG_MODE=false
DOMAIN=gym.example.com
```

#### Staging Environment File (`/opt/gym-lockers-staging/.env.example`):
```env
DB_ROOT_PASSWORD=staging_root_password
DB_NAME=gym_lockers_staging
DB_USER=gym_admin_staging
DB_PASSWORD=staging_password
MQTT_USERNAME=staging_mqtt_user
MQTT_PASSWORD=staging_mqtt_password
NODE_ENV=staging
DEBUG_MODE=true
DOMAIN=staging.gym.example.com
```

## 🚀 Deployment Workflows

### 1. Production Deployment

**Triggers:**
- Push to `main` branch (automatic)
- Manual workflow dispatch

**Process:**
1. Build Docker images (backend & frontend)
2. Push images to GitHub Container Registry (GHCR)
3. Deploy to production server via SSH
4. Run health checks
5. Send notifications

**Usage:**
```bash
# Automatic: Push to main branch
git push origin main

# Manual: Use GitHub UI
# Go to Actions → Deploy to Production → Run workflow
```

### 2. Staging Deployment

**Triggers:**
- Push to `develop` or `staging` branch
- Pull requests to `main` (builds only)
- Manual workflow dispatch

**Process:**
1. Build staging Docker images
2. Deploy to staging server (different ports)
3. Run staging tests
4. Comment on PR with staging links

**Staging Ports:**
- Frontend: `:8080`
- Backend API: `:3101`
- Database: `:3406`
- HTTPS: `:8443`

### 3. Manual Deployment

Use GitHub UI for manual deployments:

1. Go to **Actions** tab
2. Select **Deploy to Production** or **Deploy to Staging**
3. Click **Run workflow**
4. Choose options:
   - Environment: `production` or `staging`
   - Force rebuild: `true` or `false`
   - Branch: specify branch to deploy

## 🔍 Monitoring & Troubleshooting

### Health Check Endpoints

**Production:**
- Frontend: `https://your-domain.com/`
- API: `https://your-domain.com/api/status`
- Direct Backend: `http://server-ip:3001/api/status`

**Staging:**
- Frontend: `http://staging-domain.com:8080/`
- API: `http://staging-domain.com:3101/api/status`

### Common Issues

#### 1. SSH Connection Failed
```bash
# Check SSH key format
cat ~/.ssh/gym_lockers_deploy | head -1
# Should start with: -----BEGIN OPENSSH PRIVATE KEY-----

# Test SSH connection
ssh -i ~/.ssh/gym_lockers_deploy user@server-ip
```

#### 2. Docker Permission Denied
```bash
# On target server, add user to docker group
sudo usermod -aG docker $USER
sudo systemctl restart docker
```

#### 3. Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop nginx  # if using system nginx
sudo docker stop $(sudo docker ps -q)  # stop all containers
```

#### 4. Image Pull Failed
```bash
# Manually test image pull
docker pull ghcr.io/your-username/lockers/backend:latest

# Check GitHub token permissions
# Ensure GITHUB_TOKEN has packages:write permission
```

### Debugging Commands

```bash
# Check deployment directory
ls -la /opt/gym-lockers/

# View container status
sudo docker compose ps
sudo docker compose logs backend
sudo docker compose logs frontend-builder

# Check service health
curl http://localhost:3001/api/status
curl http://localhost/

# View GitHub Actions logs
# Go to GitHub → Actions → Select workflow run
```

## 🔒 Security Considerations

### 1. SSH Keys
- Use dedicated SSH keys for deployment
- Restrict SSH key permissions on server
- Rotate keys regularly

### 2. Secrets Management
- Never commit secrets to repository
- Use GitHub encrypted secrets
- Rotate database passwords regularly

### 3. Server Security
- Keep server updated
- Use firewall rules
- Monitor access logs
- Use HTTPS in production

### 4. Container Security
- Regularly update base images
- Scan images for vulnerabilities
- Use non-root users in containers

## 📊 Environment Comparison

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| **Trigger** | Manual | Auto (develop) | Auto (main) |
| **Debug Mode** | `true` | `true` | `false` |
| **Ports** | 3000, 3001 | 8080, 3101 | 80, 443 |
| **SSL** | No | Optional | Required |
| **Database** | Local | Staging DB | Production DB |
| **Monitoring** | Minimal | Basic | Full |

## 🚀 Quick Start Checklist

- [ ] Set up GitHub repository secrets
- [ ] Generate and configure SSH keys
- [ ] Prepare target server(s)
- [ ] Create environment files
- [ ] Test SSH connection
- [ ] Run first deployment
- [ ] Verify health checks
- [ ] Set up monitoring

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [SSH Key Management](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

**Next Steps**: 
1. Follow setup instructions above
2. Test staging deployment first
3. Deploy to production
4. Set up monitoring and alerting
5. Configure automatic database backups
