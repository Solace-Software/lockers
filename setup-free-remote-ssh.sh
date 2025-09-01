#!/bin/bash

# Free Remote SSH Access Setup
# Multiple free alternatives to Tailscale for remote SSH access
# Author: AI Assistant
# Date: $(date)

echo "🆓 Free Remote SSH Access Setup"
echo "================================"
echo "Choose from multiple free alternatives to Tailscale:"
echo ""
echo "1. 🔒 WireGuard VPN (Self-hosted, completely free)"
echo "2. 🌐 ZeroTier (Free tier: 25 devices)"
echo "3. 🔄 SSH Reverse Tunnel (Free, uses existing SSH)"
echo "4. ☁️  Cloudflare Tunnel (Free tier available)"
echo "5. 🚇 ngrok (Free tier with limitations)"
echo "6. 📡 Dynamic DNS + Port Forwarding (Free)"
echo "7. 🔧 All-in-one setup (Recommended)"
echo ""

read -p "Select option (1-7): " choice

case $choice in
    1)
        echo "🔒 Setting up WireGuard VPN..."
        ./setup-wireguard-ssh.sh
        ;;
    2)
        echo "🌐 Setting up ZeroTier..."
        ./setup-zerotier-ssh.sh
        ;;
    3)
        echo "🔄 Setting up SSH Reverse Tunnel..."
        ./setup-ssh-reverse-tunnel.sh
        ;;
    4)
        echo "☁️  Setting up Cloudflare Tunnel..."
        ./setup-cloudflare-tunnel.sh
        ;;
    5)
        echo "🚇 Setting up ngrok..."
        ./setup-ngrok-ssh.sh
        ;;
    6)
        echo "📡 Setting up Dynamic DNS..."
        ./setup-dynamic-dns.sh
        ;;
    7)
        echo "🔧 Setting up all-in-one solution..."
        ./setup-all-in-one-ssh.sh
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Setup completed!"
echo "📋 Your server IP: 100.81.165.23"
echo "🔗 Test connection with the provided instructions"
