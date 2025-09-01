#!/bin/bash

# INZAN Server: Restart ngrok tunnel
# Run this script ON the server if ngrok tunnel goes down

echo "🚇 INZAN Gym Lockers - Restart ngrok Tunnel"
echo "==========================================="

# Kill any existing ngrok processes
echo "🛑 Stopping any existing ngrok processes..."
pkill -f ngrok

sleep 2

# Start new ngrok tunnel
echo "🚀 Starting new ngrok tunnel..."
echo "📋 This will create a new public address"
echo ""

# Start ngrok in background and capture output
ngrok tcp 22 &
NGROK_PID=$!

echo "✅ ngrok started with PID: $NGROK_PID"
echo ""
echo "⏳ Waiting for tunnel to establish..."
sleep 5

# Get tunnel information
echo "📡 Tunnel Information:"
echo "====================="

# Try to get tunnel info from ngrok API
if curl -s http://localhost:4040/api/tunnels | grep -q "tcp://"; then
    TUNNEL_INFO=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
    if [ "$TUNNEL_INFO" != "null" ] && [ -n "$TUNNEL_INFO" ]; then
        echo "🔗 New tunnel address: $TUNNEL_INFO"
        echo ""
        # Extract host and port
        HOST=$(echo "$TUNNEL_INFO" | sed 's/tcp:\/\///' | cut -d':' -f1)
        PORT=$(echo "$TUNNEL_INFO" | sed 's/tcp:\/\///' | cut -d':' -f2)
        echo "📋 SSH Connection Command:"
        echo "   ssh root@$HOST -p $PORT"
    else
        echo "⚠️  Could not parse tunnel info automatically"
        echo "🔍 Check tunnel status manually:"
        echo "   curl http://localhost:4040/api/tunnels"
    fi
else
    echo "⚠️  Tunnel may still be starting up"
    echo "🔍 Check ngrok web interface: http://localhost:4040"
fi

echo ""
echo "📊 Process Status:"
ps aux | grep ngrok | grep -v grep

echo ""
echo "💡 Tips:"
echo "   - Keep this terminal open to see ngrok logs"
echo "   - Press Ctrl+C to stop the tunnel"
echo "   - View web interface: http://localhost:4040"
echo "   - Update your local scripts with the new address"

# Keep ngrok running in foreground
wait $NGROK_PID
