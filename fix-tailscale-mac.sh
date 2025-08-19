#!/bin/bash

# Fix Tailscale Connection on Mac
# This script helps resolve Tailscale connection issues

echo "🔧 Fixing Tailscale Connection on Mac"
echo "======================================"

echo "📋 Current situation:"
echo "   ✅ Server has Tailscale IP: 100.81.165.23"
echo "   ❌ Mac cannot connect to server"
echo "   🎯 Goal: Get Mac connected to Tailscale network"
echo ""

# Step 1: Check if Tailscale app is running
echo "1️⃣ Checking Tailscale app status..."
if pgrep -f "Tailscale" > /dev/null; then
    echo "   ✅ Tailscale app is running"
else
    echo "   ❌ Tailscale app not running"
    echo "   🔧 Starting Tailscale app..."
    open /Applications/Tailscale.app
    sleep 5
fi

echo ""

# Step 2: Try to connect
echo "2️⃣ Attempting to connect to Tailscale..."
echo "   This will open a browser for authentication..."
echo ""

# Try to start Tailscale
if tailscale up; then
    echo "   ✅ Tailscale connection successful!"
else
    echo "   ❌ Connection failed. Trying alternative method..."
    
    # Try using the app's built-in login
    echo "   🔧 Please click on the Tailscale icon in your menu bar"
    echo "       and select 'Log in to Tailscale'"
    echo ""
    read -p "   Press Enter after you've logged in via the menu bar..."
fi

echo ""

# Step 3: Check status
echo "3️⃣ Checking connection status..."
if tailscale status > /dev/null 2>&1; then
    echo "   ✅ Tailscale is connected!"
    echo ""
    echo "📊 Network Status:"
    tailscale status
    echo ""
    
    # Step 4: Test connection to server
    echo "4️⃣ Testing connection to your server..."
    SERVER_IP="100.81.165.23"
    
    if ping -c 1 -W 5 "$SERVER_IP" > /dev/null 2>&1; then
        echo "   ✅ Can ping server at $SERVER_IP"
        echo ""
        echo "🔐 Testing SSH connection..."
        echo "   (This will timeout after 10 seconds if SSH isn't working)"
        
        if timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes rubik@"$SERVER_IP" exit 2>/dev/null; then
            echo "   ✅ SSH connection successful!"
        else
            echo "   ❌ SSH connection failed. Possible issues:"
            echo "       - SSH service not running on server"
            echo "       - Wrong username (tried 'rubik')"
            echo "       - SSH keys not set up"
            echo ""
            echo "   🔧 Try these commands:"
            echo "       ssh root@$SERVER_IP"
            echo "       ssh ubuntu@$SERVER_IP"
            echo "       ssh admin@$SERVER_IP"
        fi
    else
        echo "   ❌ Cannot ping server at $SERVER_IP"
        echo "       Server might not be connected to Tailscale network"
    fi
else
    echo "   ❌ Tailscale still not connected"
    echo ""
    echo "🛠️  Manual steps to try:"
    echo "   1. Click Tailscale icon in menu bar"
    echo "   2. Select 'Log in to Tailscale'"
    echo "   3. Complete authentication in browser"
    echo "   4. Wait for connection to establish"
    echo ""
    echo "   Then run: ./fix-tailscale-mac.sh"
fi

echo ""
echo "📱 Quick Connection Guide:"
echo "=========================="
echo "Once connected, use these commands:"
echo "   • Check status: tailscale status"
echo "   • Connect to server: ssh rubik@100.81.165.23"
echo "   • Or try: ssh root@100.81.165.23"
echo ""
echo "🌐 Web access to your gym lockers:"
echo "   http://100.81.165.23:3001"
