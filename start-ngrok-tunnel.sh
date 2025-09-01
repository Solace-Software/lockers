#!/bin/bash
# Run this ON your server

echo "🚇 Starting ngrok SSH tunnel..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
fi

# Setup authtoken
read -p "Enter your ngrok authtoken: " authtoken
if [ -n "$authtoken" ]; then
    ngrok config add-authtoken "$authtoken"
    echo "✅ ngrok configured!"
    echo "🔗 Starting SSH tunnel..."
    ngrok tcp 22
else
    echo "❌ No authtoken provided"
fi
