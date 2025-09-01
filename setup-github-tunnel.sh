#!/bin/bash

# GitHub Codespaces SSH Tunnel Setup
# Completely free alternative - no credit card required

echo "🐙 GitHub Codespaces SSH Tunnel Setup"
echo "====================================="
echo "This method is 100% free and requires no credit card!"
echo ""

# Create server setup script
cat > github-tunnel-server.sh << 'EOF'
#!/bin/bash
# Run this ON your server to create GitHub tunnel

echo "🐙 GitHub Codespaces Tunnel Setup"
echo "================================="
echo ""
echo "📋 Instructions:"
echo "1. Go to: https://github.com/codespaces"
echo "2. Create a new codespace (60 hours free per month)"
echo "3. In the codespace terminal, run: socat TCP-LISTEN:2222,fork TCP:localhost:22"
echo "4. Get the codespace URL (format: username-repo-hash.github.dev)"
echo "5. Run this script with that URL"
echo ""

read -p "Enter your GitHub Codespace URL (e.g., username-repo-abc123.github.dev): " codespace_url

if [ -n "$codespace_url" ]; then
    echo "🔗 Creating persistent tunnel to $codespace_url..."
    
    # Create persistent tunnel script
    cat > /root/start-github-tunnel.sh << EOL
#!/bin/bash
# Persistent GitHub tunnel
while true; do
    echo "🔄 Connecting to GitHub Codespace..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \\
        -R 2222:localhost:22 \\
        root@$codespace_url
    echo "❌ Connection lost, retrying in 10 seconds..."
    sleep 10
done
EOL
    chmod +x /root/start-github-tunnel.sh
    
    echo "✅ Tunnel script created!"
    echo ""
    echo "🚀 To start the tunnel:"
    echo "   /root/start-github-tunnel.sh"
    echo ""
    echo "🔗 To connect from outside:"
    echo "   ssh root@$codespace_url -t 'ssh root@localhost -p 2222'"
    echo ""
    echo "💡 The tunnel will automatically reconnect if it drops"
    
else
    echo "❌ No codespace URL provided"
fi
EOF

# Create connection script for local use
cat > connect-github-tunnel.sh << 'EOF'
#!/bin/bash
# Connect via GitHub Codespace tunnel

echo "🐙 Connecting via GitHub Codespace..."
echo ""

read -p "Enter your GitHub Codespace URL: " codespace_url

if [ -n "$codespace_url" ]; then
    echo "🔗 Connecting through $codespace_url..."
    ssh -t root@"$codespace_url" "ssh root@localhost -p 2222"
else
    echo "❌ No codespace URL provided"
fi
EOF
chmod +x connect-github-tunnel.sh

echo "✅ GitHub tunnel scripts created!"
echo ""
echo "📋 Setup Steps:"
echo "1. Go to https://github.com/codespaces"
echo "2. Create a new codespace (free 60 hours/month)"
echo "3. Copy github-tunnel-server.sh to your server"
echo "4. Run it on server with your codespace URL"
echo "5. Use connect-github-tunnel.sh to connect"
echo ""

# Try to copy to server
echo "📤 Copying setup script to server..."
if scp -o ConnectTimeout=5 github-tunnel-server.sh root@100.81.165.23:/root/ 2>/dev/null; then
    echo "✅ Script copied to server!"
    echo ""
    echo "🔗 Next: SSH to server and run:"
    echo "   ssh root@100.81.165.23"
    echo "   bash /root/github-tunnel-server.sh"
else
    echo "❌ Auto-copy failed. Manual copy needed."
    echo "💡 Copy github-tunnel-server.sh to your server via Tailscale"
fi
