#!/bin/bash

# Tailscale Server Setup Script
# Run this script ON your server (192.168.10.31)

echo "🔗 Installing Tailscale on Gym Lockers Server"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script should be run as root or with sudo"
    echo "   Usage: sudo bash tailscale-server-setup.sh"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update

# Install Tailscale
echo "🔗 Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

# Enable IP forwarding (optional, for subnet routing)
echo "🌐 Enabling IP forwarding..."
echo 'net.ipv4.ip_forward = 1' | tee -a /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding = 1' | tee -a /etc/sysctl.conf
sysctl -p

# Start Tailscale
echo "🚀 Starting Tailscale..."
echo ""
echo "📋 You'll need to authenticate in a web browser."
echo "   Copy the URL that appears and open it on a device with a browser."
echo ""
read -p "Press Enter to continue with Tailscale authentication..."

# Start Tailscale with SSH enabled
tailscale up --ssh

echo ""
echo "✅ Tailscale setup completed!"
echo ""
echo "📋 Important Information:"
echo "========================="

# Get Tailscale IP
TAILSCALE_IP=$(tailscale ip -4)
echo "🌐 Your server's Tailscale IP: $TAILSCALE_IP"
echo ""

# Get status
echo "📊 Tailscale Status:"
tailscale status

echo ""
echo "🔐 SSH Access:"
echo "   From any device on your Tailscale network:"
echo "   ssh root@$TAILSCALE_IP"
echo ""
echo "🎯 Benefits you now have:"
echo "   ✅ Secure SSH access from anywhere"
echo "   ✅ No port forwarding needed"
echo "   ✅ Works with dynamic IPs"
echo "   ✅ Encrypted connection"
echo "   ✅ Access your gym lockers dashboard remotely"
echo ""
echo "🌐 Web Access:"
echo "   Gym Lockers Dashboard: http://$TAILSCALE_IP:3001"
echo ""
echo "📱 Next Steps:"
echo "   1. Install Tailscale on your other devices"
echo "   2. Connect from anywhere: ssh root@$TAILSCALE_IP"
echo "   3. Access your gym lockers system remotely!"
