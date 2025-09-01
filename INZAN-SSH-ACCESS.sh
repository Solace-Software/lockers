#!/bin/bash

# INZAN Gym Lockers SSH Access
# Permanent connection script for easy server access
# Server: 100.81.165.23 (INZAN SSH connection)

echo "🏋️ INZAN Gym Lockers SSH Access"
echo "==============================="

# Server details
SERVER_NAME="INZAN Gym Lockers"
SERVER_IP="100.81.165.23"
NGROK_HOST="4.tcp.eu.ngrok.io"
NGROK_PORT="13583"
SSH_USER="root"

echo "Select connection method:"
echo "1. 🚇 ngrok tunnel (current working method)"
echo "2. 🌐 Direct IP access"
echo "3. 🔧 Server management (start/stop services)"
echo "4. 📊 Connection status check"
echo "5. 🆘 Emergency troubleshooting"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "🚇 Connecting via ngrok tunnel..."
        echo "🔗 Command: ssh $SSH_USER@$NGROK_HOST -p $NGROK_PORT"
        echo ""
        ssh $SSH_USER@$NGROK_HOST -p $NGROK_PORT
        ;;
    2)
        echo "🌐 Attempting direct connection..."
        echo "🔗 Command: ssh $SSH_USER@$SERVER_IP"
        echo ""
        ssh $SSH_USER@$SERVER_IP
        ;;
    3)
        echo "🔧 Server Management"
        echo "==================="
        echo "Available commands:"
        echo "  - Restart ngrok: ngrok tcp 22"
        echo "  - Check containers: docker ps"
        echo "  - View logs: docker logs gym-lockers-backend"
        echo "  - Restart services: docker-compose restart"
        echo ""
        read -p "Connect to server for management? (y/n): " manage
        if [[ $manage =~ ^[Yy]$ ]]; then
            ssh $SSH_USER@$NGROK_HOST -p $NGROK_PORT
        fi
        ;;
    4)
        echo "📊 Checking connection status..."
        echo ""
        echo "🔍 Testing ngrok tunnel..."
        if nc -z $NGROK_HOST $NGROK_PORT 2>/dev/null; then
            echo "✅ ngrok tunnel: ONLINE"
        else
            echo "❌ ngrok tunnel: OFFLINE"
        fi
        
        echo "🔍 Testing direct connection..."
        if ping -c 1 $SERVER_IP &>/dev/null; then
            echo "✅ Server ping: REACHABLE"
        else
            echo "❌ Server ping: UNREACHABLE"
        fi
        
        echo "🔍 Testing SSH port..."
        if nc -z $SERVER_IP 22 2>/dev/null; then
            echo "✅ SSH port 22: OPEN"
        else
            echo "❌ SSH port 22: CLOSED"
        fi
        ;;
    5)
        echo "🆘 Emergency Troubleshooting"
        echo "============================"
        echo ""
        echo "If ngrok tunnel is down:"
        echo "1. SSH to server via any working method"
        echo "2. Run: ngrok tcp 22"
        echo "3. Note the new forwarding address"
        echo "4. Update this script with new details"
        echo ""
        echo "If server is completely unreachable:"
        echo "1. Check if Tailscale is still active"
        echo "2. Try physical access to server"
        echo "3. Check router/firewall settings"
        echo "4. Contact hosting provider if needed"
        echo ""
        echo "Current saved connection details:"
        echo "  Server IP: $SERVER_IP"
        echo "  ngrok host: $NGROK_HOST"
        echo "  ngrok port: $NGROK_PORT"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
