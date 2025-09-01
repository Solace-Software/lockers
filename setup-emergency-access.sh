#!/bin/bash

# Emergency SSH Access Setup
# Quick setup while you still have Tailscale access
# Creates multiple backup methods before Tailscale expires

echo "🚨 Emergency SSH Access Setup"
echo "=============================="
echo "Setting up backup access before Tailscale expires..."

# Method 1: SSH Reverse Tunnel via GitHub Codespaces (Free)
setup_github_tunnel() {
    echo "🔄 Setting up GitHub Codespaces tunnel..."
    echo ""
    echo "📋 Instructions:"
    echo "1. Go to https://github.com/codespaces"
    echo "2. Create a new codespace (free 60 hours/month)"
    echo "3. In the codespace terminal, run: nc -l -p 2222"
    echo "4. On your server, run the tunnel command below"
    echo ""
    
    cat > start-github-tunnel.sh << 'EOF'
#!/bin/bash
# Run this ON your server to create tunnel via GitHub Codespaces

echo "🔄 Starting GitHub Codespaces tunnel..."
read -p "Enter your GitHub Codespaces hostname (e.g., username-repo-12345.github.dev): " codespace_host

if [ -n "$codespace_host" ]; then
    echo "🔗 Creating tunnel to $codespace_host..."
    ssh -R 2222:localhost:22 -o StrictHostKeyChecking=no root@"$codespace_host"
else
    echo "❌ No codespace hostname provided"
fi
EOF
    chmod +x start-github-tunnel.sh
    
    cat > connect-github-tunnel.sh << 'EOF'
#!/bin/bash
# Connect via GitHub Codespaces tunnel

read -p "Enter your GitHub Codespaces hostname: " codespace_host
if [ -n "$codespace_host" ]; then
    echo "🔗 Connecting via $codespace_host..."
    ssh -t root@"$codespace_host" "ssh root@localhost -p 2222"
else
    echo "❌ No codespace hostname provided"
fi
EOF
    chmod +x connect-github-tunnel.sh
    
    echo "✅ GitHub tunnel scripts created"
}

# Method 2: ngrok (Free tier)
setup_ngrok_quick() {
    echo "🚇 Setting up ngrok tunnel..."
    echo ""
    echo "📋 Quick ngrok setup:"
    echo "1. Sign up at: https://ngrok.com/"
    echo "2. Get your authtoken"
    echo "3. Install ngrok on server"
    echo ""
    
    cat > start-ngrok-tunnel.sh << 'EOF'
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
EOF
    chmod +x start-ngrok-tunnel.sh
    echo "✅ ngrok tunnel script created"
}

# Method 3: Dynamic DNS for direct access
setup_dynamic_dns_quick() {
    echo "📡 Setting up Dynamic DNS..."
    
    cat > setup-duckdns.sh << 'EOF'
#!/bin/bash
# Quick DuckDNS setup

echo "🦆 DuckDNS Setup"
echo "==============="
echo "1. Sign up at: https://www.duckdns.org/"
echo "2. Create a subdomain"
echo "3. Get your token"
echo ""

read -p "Enter your DuckDNS domain (without .duckdns.org): " domain
read -p "Enter your DuckDNS token: " token

if [ -n "$domain" ] && [ -n "$token" ]; then
    # Create update script
    cat > update-duckdns.sh << EOL
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=$domain&token=$token&ip="
echo "Updated $domain.duckdns.org"
EOL
    chmod +x update-duckdns.sh
    
    # Run initial update
    ./update-duckdns.sh
    
    echo "✅ DuckDNS configured!"
    echo "🌐 Your domain: $domain.duckdns.org"
    echo "🔗 SSH command: ssh root@$domain.duckdns.org"
    echo ""
    echo "📋 Setup port forwarding on your router:"
    echo "   External Port: 22 -> Internal IP: 100.81.165.23 -> Internal Port: 22"
else
    echo "❌ Missing domain or token"
fi
EOF
    chmod +x setup-duckdns.sh
    echo "✅ DuckDNS setup script created"
}

# Create test connection script
create_test_script() {
    cat > test-all-connections.sh << 'EOF'
#!/bin/bash
# Test all available connection methods

echo "🔍 Testing All Connection Methods"
echo "================================="

# Test WireGuard
echo "🔒 Testing WireGuard..."
if [ -f "wg0-primary.conf" ]; then
    sudo wg-quick up wg0-primary.conf 2>/dev/null
    if ping -c 1 10.0.0.1 &>/dev/null; then
        echo "✅ WireGuard: Working"
        sudo wg-quick down wg0-primary.conf 2>/dev/null
    else
        echo "❌ WireGuard: Failed"
        sudo wg-quick down wg0-primary.conf 2>/dev/null
    fi
else
    echo "⚠️  WireGuard: Not configured"
fi

# Test direct SSH
echo "🌐 Testing direct SSH..."
if ping -c 1 100.81.165.23 &>/dev/null; then
    echo "✅ Direct SSH: Server reachable"
else
    echo "❌ Direct SSH: Server unreachable"
fi

# Test Tailscale (if still active)
echo "🔗 Testing Tailscale..."
if command -v tailscale &>/dev/null && tailscale status &>/dev/null; then
    echo "✅ Tailscale: Still active"
else
    echo "❌ Tailscale: Not active"
fi

echo ""
echo "📋 Available connection scripts:"
ls -1 connect-*.sh 2>/dev/null || echo "No connection scripts found"
EOF
    chmod +x test-all-connections.sh
    echo "✅ Test script created"
}

# Main execution
echo "🚀 Setting up emergency access methods..."
echo ""

setup_github_tunnel
echo ""
setup_ngrok_quick
echo ""
setup_dynamic_dns_quick
echo ""
create_test_script

echo ""
echo "✅ Emergency access setup completed!"
echo ""
echo "📋 Next Steps (while you still have Tailscale):"
echo "1. Copy install-wireguard-server.sh to your server"
echo "2. Copy wg0-server.conf to your server"
echo "3. Run setup on server via Tailscale"
echo "4. Test WireGuard connection"
echo "5. Setup one backup method (GitHub/ngrok/DuckDNS)"
echo ""
echo "🔧 Files created:"
echo "   - install-wireguard-server.sh (main setup)"
echo "   - start-github-tunnel.sh (emergency tunnel)"
echo "   - start-ngrok-tunnel.sh (ngrok tunnel)"
echo "   - setup-duckdns.sh (dynamic DNS)"
echo "   - test-all-connections.sh (test all methods)"
echo ""
echo "⚡ Quick test: ./test-all-connections.sh"
