#!/bin/bash

# Emergency SSH setup via ngrok
# Run this script to set up ngrok tunnel on your server

echo "🚨 Emergency SSH Access via ngrok"
echo "================================="

# Create server setup script
cat > server-ngrok-setup.sh << 'EOF'
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
EOF

echo "📄 Created server setup script"
echo ""
echo "🚀 Next steps:"
echo "1. Copy this script to your server via Tailscale"
echo "2. Run it on the server"
echo "3. Sign up for ngrok (free)"
echo "4. Configure and start tunnel"
echo ""

# Function to copy to server
copy_to_server() {
    echo "📤 Attempting to copy to server..."
    
    # First try via Tailscale IP (most likely to work)
    for ip in "100.81.165.23" "154.183.241.245"; do
        echo "🔄 Trying $ip..."
        if scp -o ConnectTimeout=5 server-ngrok-setup.sh root@$ip:/root/ 2>/dev/null; then
            echo "✅ Script copied to $ip successfully!"
            echo "🔗 Now SSH to server and run:"
            echo "   ssh root@$ip"
            echo "   bash /root/server-ngrok-setup.sh"
            return 0
        fi
    done
    
    echo "❌ Could not copy automatically"
    echo "💡 Manual copy: Use your current Tailscale session"
    return 1
}

read -p "Try to copy script to server? (y/n): " copy_choice
if [[ $copy_choice =~ ^[Yy]$ ]]; then
    copy_to_server
else
    echo "ℹ️  Manual setup: Copy server-ngrok-setup.sh to your server"
fi
