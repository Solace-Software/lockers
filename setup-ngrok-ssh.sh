#!/bin/bash

# ngrok SSH Tunnel Setup
# Provides instant public SSH access without port forwarding

echo "🚇 Setting up ngrok SSH Tunnel"
echo "==============================="

# Function to install ngrok
install_ngrok() {
    echo "📦 Installing ngrok..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "📥 Download ngrok from: https://ngrok.com/download"
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok
    else
        echo "❌ Unsupported OS. Download from https://ngrok.com/download"
        return 1
    fi
}

# Function to setup ngrok
setup_ngrok() {
    echo "⚙️  Setting up ngrok..."
    echo ""
    echo "🔑 You need an ngrok account (free):"
    echo "   1. Sign up at: https://dashboard.ngrok.com/signup"
    echo "   2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo ""
    read -p "Enter your ngrok authtoken: " authtoken
    
    if [ -n "$authtoken" ]; then
        ngrok config add-authtoken "$authtoken"
        echo "✅ ngrok configured!"
        echo ""
        echo "📋 To create SSH tunnel on your server:"
        echo "   ngrok tcp 22"
        echo ""
        echo "   This will give you a public address like:"
        echo "   tcp://0.tcp.ngrok.io:12345"
        echo ""
        echo "   Then connect with:"
        echo "   ssh root@0.tcp.ngrok.io -p 12345"
    else
        echo "❌ No authtoken provided"
    fi
}

# Create server-side script
create_server_script() {
    cat > ngrok-ssh-server.sh << 'EOF'
#!/bin/bash
# Run this script ON your server to expose SSH via ngrok

echo "🚇 Starting ngrok SSH tunnel..."
echo "==============================="

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok on server..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
fi

# Start SSH tunnel
echo "🔗 Starting SSH tunnel on port 22..."
echo "📋 Copy the forwarding address (tcp://...) and use it to connect!"
echo "🛑 Press Ctrl+C to stop the tunnel"
echo ""

ngrok tcp 22
EOF
    chmod +x ngrok-ssh-server.sh
    echo "📄 Created ngrok-ssh-server.sh (copy this to your server)"
}

# Main execution
echo "ngrok provides:"
echo "✅ Instant public SSH access"
echo "✅ No router configuration needed"
echo "✅ Free tier available"
echo "✅ HTTPS/TCP tunnels"
echo "❌ Free tier has session limits"
echo "❌ URLs change on restart (unless paid)"
echo ""

read -p "Install and setup ngrok? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    install_ngrok && setup_ngrok && create_server_script
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy ngrok-ssh-server.sh to your server"
    echo "2. Run it: bash ngrok-ssh-server.sh"
    echo "3. Copy the tcp://... address it gives you"
    echo "4. Connect: ssh root@[ngrok-address] -p [ngrok-port]"
else
    echo "ℹ️  Manual setup at: https://ngrok.com/download"
fi
