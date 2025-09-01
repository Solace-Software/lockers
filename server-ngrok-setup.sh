#!/bin/bash
# Run this ON your server via Tailscale

echo "🚇 Installing ngrok on server..."

# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

echo "✅ ngrok installed!"
echo ""
echo "📋 Setup steps:"
echo "1. Sign up at: https://ngrok.com/ (free)"
echo "2. Get your authtoken from dashboard"
echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
echo "4. Run: ngrok tcp 22"
echo ""
echo "🔗 This will give you a public address like:"
echo "   tcp://0.tcp.ngrok.io:12345"
echo ""
echo "   Then connect with:"
echo "   ssh root@0.tcp.ngrok.io -p 12345"
