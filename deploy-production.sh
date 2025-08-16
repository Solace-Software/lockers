#!/bin/bash

# Production Deployment Script for Headless Ubuntu Server
echo "🚀 Starting Gym Lockers Production Deployment..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# Load production environment variables
if [ -f "env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(cat env.production | grep -v '^#' | xargs)
else
    echo "❌ No env.production file found. Please create it first."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📋 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p /opt/gym-lockers/{db-data,db-init,mqtt-data,mqtt-logs,nginx/ssl}
cd /opt/gym-lockers

# Copy project files
echo "📋 Copying project files..."
cp -r /path/to/your/project/* .

# Generate self-signed SSL certificate (replace with Let's Encrypt in production)
echo "🔒 Generating SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Set proper permissions
chown -R $SUDO_USER:$SUDO_USER /opt/gym-lockers
chmod 600 nginx/ssl/*.pem

# Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/gym-lockers.service << EOF
[Unit]
Description=Gym Lockers Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/gym-lockers
ExecStart=/usr/local/bin/docker-compose --profile prod up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable gym-lockers
systemctl start gym-lockers

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "🏥 Checking service status..."
systemctl status gym-lockers
docker-compose ps

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "🌐 Web Interface: https://$DOMAIN"
echo "🔧 API: https://$DOMAIN/api"
echo "📡 MQTT: $DOMAIN:1883"
echo "🌐 MQTT WebSocket: wss://$DOMAIN/mqtt"
echo ""
echo "📋 Management commands:"
echo "  Start: sudo systemctl start gym-lockers"
echo "  Stop: sudo systemctl stop gym-lockers"
echo "  Status: sudo systemctl status gym-lockers"
echo "  Logs: sudo journalctl -u gym-lockers -f"
echo "  Update: cd /opt/gym-lockers && git pull && docker-compose up -d"
