# 🔧 GitHub Actions Troubleshooting Guide

## Common Workflow Failures and Solutions

### 1. CI Pipeline Failures

#### **MySQL Connection Issues**
```
Error: mysql: command not found
```
**Solution**: The workflow now installs `mysql-client` automatically.

#### **Node.js Dependencies Issues**
```
Error: Cannot find module
```
**Solutions**:
- The workflow uses `npm ci` with fallback to `npm install`
- Check that `package-lock.json` files exist
- Verify Node.js version compatibility

#### **Test Script Missing**
```
Error: Missing script: test
```
**Solution**: The workflow now creates a default test script if none exists.

#### **Docker Compose Version Issues**
```
Error: unknown flag: --profile
```
**Solution**: The workflow detects available Docker Compose version and uses appropriate commands.

### 2. Deployment Failures

#### **Missing Secrets**
```
Error: SSH_PRIVATE_KEY secret not found
```
**Solution**: Add required secrets to GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   ```
   SSH_PRIVATE_KEY      # Your SSH private key content
   SERVER_HOST          # Server IP or hostname
   SERVER_USER          # SSH username (e.g., root)
   DB_ROOT_PASSWORD     # Database root password
   DB_PASSWORD          # Application database password
   MQTT_USERNAME        # MQTT broker username
   MQTT_PASSWORD        # MQTT broker password
   DOMAIN               # Your domain name
   ```

#### **SSH Connection Failed**
```
Error: Permission denied (publickey)
```
**Solutions**:
1. **Generate SSH key pair**:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```

2. **Add public key to server**:
   ```bash
   ssh-copy-id user@your-server.com
   ```

3. **Add private key to GitHub secrets**:
   ```bash
   cat ~/.ssh/id_ed25519  # Copy this to SSH_PRIVATE_KEY secret
   ```

#### **Server Not Prepared**
```
Error: /opt/gym-lockers: No such file or directory
```
**Solution**: Prepare the server:
```bash
# On target server
sudo mkdir -p /opt/gym-lockers
sudo chown $USER:$USER /opt/gym-lockers
cd /opt/gym-lockers
git clone https://github.com/YOUR_USERNAME/lockers.git .

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### **Docker Permission Issues**
```
Error: permission denied while trying to connect to the Docker daemon
```
**Solution**:
```bash
sudo usermod -aG docker $USER
sudo systemctl restart docker
# Log out and log back in
```

### 3. Image Build Failures

#### **Frontend Build Issues**
```
Error: npm run build failed
```
**Solutions**:
- Check frontend dependencies in `gym_lockers/client/package.json`
- Verify build script exists: `"build": "react-scripts build"`
- Check for TypeScript/ESLint errors

#### **Backend Build Issues**
```
Error: COPY failed
```
**Solutions**:
- Verify `gym_lockers/Dockerfile.backend` exists
- Check `.dockerignore` files
- Ensure source files are in correct directories

#### **Registry Push Issues**
```
Error: failed to push to registry
```
**Solutions**:
- Verify GitHub token has `packages: write` permission
- Check image naming conventions
- Ensure registry URL is correct (`ghcr.io`)

### 4. Quick Fixes

#### **Reset Workflows**
If workflows are consistently failing, reset to simple versions:

```bash
# Use simple CI workflow
mv .github/workflows/ci.yml.disabled .github/workflows/ci.yml
mv .github/workflows/ci-simple.yml .github/workflows/ci.yml

# Use simple deployment workflow  
mv .github/workflows/deploy-production.yml.disabled .github/workflows/deploy-production.yml
mv .github/workflows/deploy-simple.yml .github/workflows/deploy-production.yml
```

#### **Manual Deployment**
If GitHub Actions fail, deploy manually:

```bash
# Local deployment
./deployment/deploy.sh local

# Production deployment (if server is configured)
./deployment/deploy.sh production
```

#### **Skip CI for Quick Fixes**
Add `[skip ci]` to commit message:
```bash
git commit -m "Fix documentation [skip ci]"
```

### 5. Debugging Steps

#### **Check Workflow Logs**
1. Go to GitHub → **Actions** tab
2. Click on failed workflow run
3. Expand failed job steps
4. Look for error messages in red

#### **Test Locally**
```bash
# Test Docker builds locally
docker build -t test-backend -f gym_lockers/Dockerfile.backend gym_lockers/
docker build -t test-frontend -f gym_lockers/client/Dockerfile.production gym_lockers/client/

# Test deployment script locally
./deployment/deploy.sh local --dry-run
```

#### **Validate Configuration**
```bash
# Check required files exist
ls -la .github/workflows/
ls -la gym_lockers/Dockerfile.backend
ls -la gym_lockers/client/Dockerfile.production
ls -la docker-compose.yml

# Check secrets are set (in GitHub UI)
# Settings → Secrets and variables → Actions
```

### 6. Working Configurations

#### **Simple CI Workflow** (`.github/workflows/ci-simple.yml`)
- ✅ No database dependencies
- ✅ Basic build and test
- ✅ Docker build validation
- ✅ Graceful fallbacks

#### **Simple Deploy Workflow** (`.github/workflows/deploy-simple.yml`)
- ✅ Checks for required secrets
- ✅ Skips deployment if secrets missing
- ✅ Simple deployment strategy
- ✅ Clear error messages

### 7. Success Indicators

#### **CI Success:**
```
✅ Frontend and backend dependencies installed
✅ Frontend build completed successfully  
✅ Docker images built successfully
✅ Deployment files validated
🚀 Ready for deployment!
```

#### **Deployment Success:**
```
✅ Deployment completed successfully!
🌐 Application should be available at your configured domain
📦 Docker images built and pushed to registry
```

### 8. Getting Help

If you're still having issues:

1. **Check this troubleshooting guide**
2. **Look at workflow logs** in GitHub Actions
3. **Test components individually** (Docker builds, SSH connection, etc.)
4. **Use simple workflows** instead of complex ones
5. **Deploy manually** as a fallback

Remember: The simple workflows are designed to be more reliable and provide better error messages!
