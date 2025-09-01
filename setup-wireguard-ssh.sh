#!/bin/bash

# WireGuard VPN Setup for Free Remote SSH Access
# Self-hosted, completely free alternative to Tailscale
# Provides secure mesh VPN networking

echo "🔒 WireGuard VPN Setup for Remote SSH"
echo "====================================="

# Function to install WireGuard
install_wireguard() {
    echo "📦 Installing WireGuard..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install wireguard-tools
        else
            echo "📥 Install Homebrew first or download WireGuard from App Store"
            echo "   Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt &> /dev/null; then
            sudo apt update
            sudo apt install -y wireguard wireguard-tools
        elif command -v yum &> /dev/null; then
            sudo yum install -y epel-release
            sudo yum install -y wireguard-tools
        else
            echo "❌ Unsupported Linux distribution"
            return 1
        fi
    else
        echo "❌ Unsupported OS"
        return 1
    fi
}

# Function to generate keys
generate_keys() {
    echo "🔑 Generating WireGuard keys..."
    
    # Create WireGuard directory
    sudo mkdir -p /etc/wireguard
    cd /etc/wireguard
    
    # Generate server keys
    echo "📋 Generating server keys..."
    wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key
    
    # Generate client keys
    echo "📋 Generating client keys..."
    wg genkey | sudo tee client_private.key | wg pubkey | sudo tee client_public.key
    
    # Set permissions
    sudo chmod 600 /etc/wireguard/*.key
    
    echo "✅ Keys generated successfully!"
}

# Function to create server config
create_server_config() {
    local server_private=$(sudo cat /etc/wireguard/server_private.key)
    local client_public=$(sudo cat /etc/wireguard/client_public.key)
    
    echo "📄 Creating server configuration..."
    
    sudo tee /etc/wireguard/wg0.conf > /dev/null << EOF
[Interface]
PrivateKey = $server_private
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

# Enable IP forwarding
PostUp = echo 1 > /proc/sys/net/ipv4/ip_forward
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $client_public
AllowedIPs = 10.0.0.2/32
EOF

    echo "✅ Server configuration created!"
}

# Function to create client config
create_client_config() {
    local client_private=$(sudo cat /etc/wireguard/client_private.key)
    local server_public=$(sudo cat /etc/wireguard/server_public.key)
    local server_ip="100.81.165.23"  # Your server IP
    
    echo "📄 Creating client configuration..."
    
    cat > ~/wg0-client.conf << EOF
[Interface]
PrivateKey = $client_private
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = $server_public
Endpoint = $server_ip:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

    echo "✅ Client configuration created: ~/wg0-client.conf"
}

# Function to create server setup script
create_server_script() {
    cat > wireguard-server-setup.sh << 'EOF'
#!/bin/bash
# Run this script ON your server (100.81.165.23)

echo "🔒 Installing WireGuard on server..."

# Install WireGuard
apt update
apt install -y wireguard wireguard-tools

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Configure firewall
ufw allow 51820/udp
ufw allow ssh
ufw --force enable

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo "✅ WireGuard server setup completed!"
echo "📋 Status:"
wg show

echo ""
echo "🔗 Connection info:"
echo "   Server VPN IP: 10.0.0.1"
echo "   Client VPN IP: 10.0.0.2"
echo "   SSH via VPN: ssh root@10.0.0.1"
EOF
    chmod +x wireguard-server-setup.sh
    echo "📄 Created wireguard-server-setup.sh"
}

# Function to create connection script
create_connection_script() {
    cat > connect-wireguard-ssh.sh << 'EOF'
#!/bin/bash
# Connect to your server via WireGuard VPN

echo "🔒 Connecting via WireGuard VPN..."

# Start WireGuard connection
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use wg-quick
    sudo wg-quick up ~/wg0-client.conf
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - copy config and start
    sudo cp ~/wg0-client.conf /etc/wireguard/
    sudo wg-quick up wg0-client
fi

echo "✅ VPN connected!"
echo "🔍 Testing connection..."

# Test VPN connection
if ping -c 1 10.0.0.1 &> /dev/null; then
    echo "✅ VPN connection successful!"
    echo "🔐 Connecting to SSH..."
    ssh root@10.0.0.1
else
    echo "❌ VPN connection failed"
    echo "   Check server setup and firewall"
fi

# Disconnect VPN when done
echo "🔌 Disconnecting VPN..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sudo wg-quick down ~/wg0-client.conf
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo wg-quick down wg0-client
fi
EOF
    chmod +x connect-wireguard-ssh.sh
    echo "📄 Created connect-wireguard-ssh.sh"
}

# Main execution
echo "WireGuard provides:"
echo "✅ Completely free and open source"
echo "✅ Self-hosted (no third-party service)"
echo "✅ High performance and security"
echo "✅ Works behind NAT/firewall"
echo "✅ Cross-platform support"
echo "❌ Requires manual setup on both ends"
echo "❌ Need to manage your own infrastructure"
echo ""

read -p "Install and setup WireGuard? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    install_wireguard
    if [ $? -eq 0 ]; then
        generate_keys
        create_server_config
        create_client_config
        create_server_script
        create_connection_script
        
        echo ""
        echo "✅ WireGuard setup completed!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Copy wireguard-server-setup.sh to your server"
        echo "2. Run it on server: sudo bash wireguard-server-setup.sh"
        echo "3. Copy the generated wg0.conf to /etc/wireguard/ on server"
        echo "4. Use connect-wireguard-ssh.sh to connect"
        echo ""
        echo "🔗 Connection commands:"
        echo "   Start VPN: sudo wg-quick up ~/wg0-client.conf"
        echo "   SSH: ssh root@10.0.0.1"
        echo "   Stop VPN: sudo wg-quick down ~/wg0-client.conf"
        echo ""
        echo "🔑 Key files created:"
        echo "   Server config: /etc/wireguard/wg0.conf"
        echo "   Client config: ~/wg0-client.conf"
    fi
else
    echo "ℹ️  WireGuard setup skipped"
fi
