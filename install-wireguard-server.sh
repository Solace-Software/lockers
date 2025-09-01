#!/bin/bash

# Install WireGuard on your gym server
# Run this script ON your server (100.81.165.23) while you have Tailscale access

echo "🔒 Installing WireGuard VPN on Gym Server"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script should be run as root or with sudo"
    echo "   Usage: sudo bash install-wireguard-server.sh"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update

# Install WireGuard
echo "🔗 Installing WireGuard..."
apt install -y wireguard wireguard-tools

# Create WireGuard directory
mkdir -p /etc/wireguard
chmod 700 /etc/wireguard

# Copy the server configuration (this will be done manually)
echo "📄 WireGuard server configuration:"
echo "   Copy wg0-server.conf to /etc/wireguard/wg0.conf"

# Enable IP forwarding
echo "🌐 Enabling IP forwarding..."
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 51820/udp
ufw allow ssh
ufw allow 22/tcp
ufw allow 3001/tcp  # Gym lockers web interface
ufw allow 1883/tcp  # MQTT
ufw --force enable

echo "✅ WireGuard installed and configured!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy wg0-server.conf to /etc/wireguard/wg0.conf"
echo "2. Start WireGuard: systemctl enable wg-quick@wg0"
echo "3. Start service: systemctl start wg-quick@wg0"
echo "4. Check status: wg show"
echo ""
echo "🔗 Client connection:"
echo "   sudo wg-quick up wg0-primary.conf"
echo "   ssh root@10.0.0.1"
echo "   sudo wg-quick down wg0-primary.conf"
