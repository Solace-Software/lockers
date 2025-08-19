#!/bin/bash

# Tailscale SSH Connection Script
# Use this after Tailscale is set up on both devices

echo "🔗 Tailscale SSH Connection to Gym Lockers Server"
echo "=================================================="

# Check if Tailscale is running
if ! command -v tailscale &> /dev/null; then
    echo "❌ Tailscale not installed!"
    echo "   Please install from: https://tailscale.com/download/mac"
    exit 1
fi

# Check Tailscale status
echo "📊 Checking Tailscale status..."
if ! tailscale status &> /dev/null; then
    echo "❌ Tailscale not connected!"
    echo "   Run: tailscale up"
    exit 1
fi

echo "✅ Tailscale is connected!"
echo ""

# Show current status
echo "🌐 Your Tailscale Network:"
tailscale status

echo ""
echo "🔍 Looking for your gym lockers server..."

# Try to find the server
SERVER_IP=""
while IFS= read -r line; do
    if [[ $line == *"gym"* ]] || [[ $line == *"locker"* ]] || [[ $line == *"192.168.10.31"* ]]; then
        SERVER_IP=$(echo $line | awk '{print $1}')
        break
    fi
done < <(tailscale status | tail -n +2)

if [ -z "$SERVER_IP" ]; then
    echo "❌ Could not find your gym lockers server in Tailscale network"
    echo ""
    echo "📋 Available devices:"
    tailscale status | tail -n +2
    echo ""
    read -p "Enter the Tailscale IP of your server: " SERVER_IP
fi

if [ -n "$SERVER_IP" ]; then
    echo "🎯 Found server at: $SERVER_IP"
    echo ""
    echo "🔐 Connecting to SSH..."
    echo "💡 Tip: Use Ctrl+D or type 'exit' to disconnect"
    echo ""
    
    # Connect via SSH
    ssh root@$SERVER_IP
else
    echo "❌ No server IP provided"
    exit 1
fi
