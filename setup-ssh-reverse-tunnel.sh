#!/bin/bash

# SSH Reverse Tunnel Setup for Free Remote Access
# Uses existing SSH infrastructure, completely free
# Creates persistent tunnel through intermediate server

echo "🔄 SSH Reverse Tunnel Setup"
echo "==========================="

# Function to create reverse tunnel
setup_reverse_tunnel() {
    echo "⚙️  Setting up SSH Reverse Tunnel..."
    echo ""
    echo "📋 You need an intermediate server with public IP:"
    echo "   - VPS (DigitalOcean, Linode, AWS free tier)"
    echo "   - Cloud shell (Google Cloud Shell, AWS CloudShell)"
    echo "   - Friend's server with SSH access"
    echo ""
    
    read -p "Enter intermediate server IP/hostname: " intermediate_server
    read -p "Enter intermediate server username: " intermediate_user
    read -p "Enter tunnel port (default 2222): " tunnel_port
    tunnel_port=${tunnel_port:-2222}
    
    if [ -n "$intermediate_server" ] && [ -n "$intermediate_user" ]; then
        create_tunnel_scripts "$intermediate_server" "$intermediate_user" "$tunnel_port"
    else
        echo "❌ Missing server information"
        return 1
    fi
}

# Function to create tunnel scripts
create_tunnel_scripts() {
    local server=$1
    local user=$2
    local port=$3
    
    echo "📄 Creating tunnel scripts..."
    
    # Server-side script (runs on your gym server)
    cat > start-reverse-tunnel.sh << EOF
#!/bin/bash
# Run this script ON your gym server (100.81.165.23)
# Creates reverse tunnel to intermediate server

echo "🔄 Starting SSH Reverse Tunnel..."

# Configuration
INTERMEDIATE_SERVER="$server"
INTERMEDIATE_USER="$user"
TUNNEL_PORT="$port"
LOCAL_SSH_PORT="22"

# Create persistent tunnel
echo "🔗 Creating tunnel: localhost:\$TUNNEL_PORT -> \$INTERMEDIATE_SERVER:\$LOCAL_SSH_PORT"

# Use autossh for persistent connection
if command -v autossh &> /dev/null; then
    echo "✅ Using autossh for persistent tunnel"
    autossh -M 0 -N -R \$TUNNEL_PORT:localhost:\$LOCAL_SSH_PORT \\
        -o "ServerAliveInterval=30" \\
        -o "ServerAliveCountMax=3" \\
        -o "ExitOnForwardFailure=yes" \\
        \$INTERMEDIATE_USER@\$INTERMEDIATE_SERVER
else
    echo "⚠️  autossh not found, using regular ssh (less reliable)"
    echo "   Install autossh: sudo apt install autossh"
    ssh -N -R \$TUNNEL_PORT:localhost:\$LOCAL_SSH_PORT \\
        -o "ServerAliveInterval=30" \\
        -o "ServerAliveCountMax=3" \\
        -o "ExitOnForwardFailure=yes" \\
        \$INTERMEDIATE_USER@\$INTERMEDIATE_SERVER
fi
EOF
    chmod +x start-reverse-tunnel.sh
    
    # Client connection script
    cat > connect-reverse-tunnel.sh << EOF
#!/bin/bash
# Connect to your gym server through reverse tunnel

echo "🔄 Connecting via SSH Reverse Tunnel..."

# Configuration
INTERMEDIATE_SERVER="$server"
INTERMEDIATE_USER="$user"
TUNNEL_PORT="$port"

echo "🔗 Connecting through \$INTERMEDIATE_SERVER:\$TUNNEL_PORT"
echo "💡 This connects to your gym server via the reverse tunnel"
echo ""

# Connect through the tunnel
ssh -t \$INTERMEDIATE_USER@\$INTERMEDIATE_SERVER "ssh root@localhost -p \$TUNNEL_PORT"
EOF
    chmod +x connect-reverse-tunnel.sh
    
    # Systemd service for persistent tunnel
    cat > reverse-tunnel.service << EOF
[Unit]
Description=SSH Reverse Tunnel to $server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/root/start-reverse-tunnel.sh
Restart=always
RestartSec=10
Environment=AUTOSSH_GATETIME=0

[Install]
WantedBy=multi-user.target
EOF
    
    # Installation script for server
    cat > install-reverse-tunnel.sh << 'EOF'
#!/bin/bash
# Install reverse tunnel as a service on your gym server

echo "🔧 Installing SSH Reverse Tunnel Service..."

# Install autossh for reliable tunneling
apt update
apt install -y autossh

# Copy service file
sudo cp reverse-tunnel.service /etc/systemd/system/
sudo cp start-reverse-tunnel.sh /root/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable reverse-tunnel
sudo systemctl start reverse-tunnel

echo "✅ Reverse tunnel service installed!"
echo "📊 Service status:"
sudo systemctl status reverse-tunnel

echo ""
echo "🔧 Service commands:"
echo "   Start:   sudo systemctl start reverse-tunnel"
echo "   Stop:    sudo systemctl stop reverse-tunnel"
echo "   Status:  sudo systemctl status reverse-tunnel"
echo "   Logs:    sudo journalctl -u reverse-tunnel -f"
EOF
    chmod +x install-reverse-tunnel.sh
    
    echo "✅ Tunnel scripts created!"
}

# Function to create SSH key setup
create_key_setup() {
    cat > setup-tunnel-keys.sh << 'EOF'
#!/bin/bash
# Setup SSH keys for passwordless tunnel connection

echo "🔑 Setting up SSH keys for tunnel..."

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "📋 Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -C "tunnel@$(hostname)" -f ~/.ssh/id_rsa -N ""
fi

echo "🔑 Your public key:"
cat ~/.ssh/id_rsa.pub

echo ""
echo "📋 Next steps:"
echo "1. Copy the public key above"
echo "2. Add it to ~/.ssh/authorized_keys on intermediate server"
echo "3. Test connection: ssh user@intermediate-server"
echo "4. Start tunnel: ./start-reverse-tunnel.sh"
EOF
    chmod +x setup-tunnel-keys.sh
    echo "📄 Created setup-tunnel-keys.sh"
}

# Function to create monitoring script
create_monitoring() {
    cat > monitor-tunnel.sh << 'EOF'
#!/bin/bash
# Monitor reverse tunnel status

echo "📊 SSH Reverse Tunnel Monitor"
echo "============================="

# Check if tunnel process is running
if pgrep -f "ssh.*-R" > /dev/null; then
    echo "✅ Tunnel process is running"
    echo "🔍 Process details:"
    pgrep -f "ssh.*-R" | xargs ps -p
else
    echo "❌ Tunnel process not found"
fi

echo ""
echo "🌐 Network connections:"
netstat -tlnp | grep :2222 || echo "No tunnel port found"

echo ""
echo "📋 Service status (if installed):"
if systemctl is-active --quiet reverse-tunnel; then
    echo "✅ Service is active"
    systemctl status reverse-tunnel --no-pager
else
    echo "❌ Service not active or not installed"
fi

echo ""
echo "📖 Recent logs:"
if [ -f /var/log/auth.log ]; then
    tail -10 /var/log/auth.log | grep ssh
fi
EOF
    chmod +x monitor-tunnel.sh
    echo "📄 Created monitor-tunnel.sh"
}

# Main execution
echo "SSH Reverse Tunnel provides:"
echo "✅ Completely free (uses existing SSH)"
echo "✅ No third-party service required"
echo "✅ Works through any NAT/firewall"
echo "✅ Can use free cloud shells as intermediate"
echo "❌ Requires intermediate server"
echo "❌ More complex setup"
echo "❌ Dependent on intermediate server uptime"
echo ""

echo "💡 Free intermediate server options:"
echo "   - AWS EC2 free tier"
echo "   - Google Cloud free tier"
echo "   - Oracle Cloud free tier"
echo "   - GitHub Codespaces"
echo "   - Replit"
echo ""

read -p "Setup SSH Reverse Tunnel? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    setup_reverse_tunnel
    create_key_setup
    create_monitoring
    
    echo ""
    echo "✅ SSH Reverse Tunnel setup completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Setup SSH keys: ./setup-tunnel-keys.sh"
    echo "2. Copy scripts to your server (100.81.165.23)"
    echo "3. Install on server: sudo bash install-reverse-tunnel.sh"
    echo "4. Connect: ./connect-reverse-tunnel.sh"
    echo ""
    echo "🔧 Files created:"
    echo "   - start-reverse-tunnel.sh (for server)"
    echo "   - connect-reverse-tunnel.sh (for client)"
    echo "   - install-reverse-tunnel.sh (server setup)"
    echo "   - setup-tunnel-keys.sh (key setup)"
    echo "   - monitor-tunnel.sh (monitoring)"
    echo ""
    echo "📊 Monitor tunnel: ./monitor-tunnel.sh"
else
    echo "ℹ️  SSH Reverse Tunnel setup skipped"
fi
