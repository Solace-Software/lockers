#!/bin/bash

# ZeroTier Setup for Free Remote SSH Access
# Free tier: 25 devices, managed mesh VPN
# Easy alternative to Tailscale

echo "🌐 ZeroTier Setup for Remote SSH"
echo "================================"

# Function to install ZeroTier
install_zerotier() {
    echo "📦 Installing ZeroTier..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install --cask zerotier-one
        else
            echo "📥 Download ZeroTier from: https://www.zerotier.com/download/"
            echo "   Or install Homebrew first"
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://install.zerotier.com | sudo bash
    else
        echo "❌ Unsupported OS. Download from: https://www.zerotier.com/download/"
        return 1
    fi
}

# Function to setup ZeroTier
setup_zerotier() {
    echo "⚙️  Setting up ZeroTier..."
    echo ""
    echo "🔑 You need a ZeroTier account (free):"
    echo "   1. Sign up at: https://my.zerotier.com/"
    echo "   2. Create a new network"
    echo "   3. Copy your Network ID"
    echo ""
    
    read -p "Enter your ZeroTier Network ID: " network_id
    
    if [ -n "$network_id" ]; then
        echo "🔗 Joining ZeroTier network..."
        
        # Join network
        sudo zerotier-cli join "$network_id"
        
        # Get node ID
        NODE_ID=$(sudo zerotier-cli info | cut -d' ' -f3)
        
        echo "✅ ZeroTier setup completed!"
        echo ""
        echo "📋 Important Information:"
        echo "========================="
        echo "Network ID: $network_id"
        echo "Node ID: $NODE_ID"
        echo ""
        echo "🌐 Next Steps:"
        echo "1. Go to https://my.zerotier.com/network/$network_id"
        echo "2. Authorize this device (Node ID: $NODE_ID)"
        echo "3. Note the assigned IP address"
        echo "4. Install ZeroTier on your server and repeat"
        echo "5. SSH using the ZeroTier IP: ssh root@[zerotier-ip]"
        echo ""
        echo "🔍 Useful commands:"
        echo "   zerotier-cli listnetworks  # Show networks"
        echo "   zerotier-cli peers         # Show peers"
        echo "   zerotier-cli info          # Show node info"
    else
        echo "❌ No Network ID provided"
        return 1
    fi
}

# Function to create server setup script
create_server_script() {
    cat > zerotier-server-setup.sh << 'EOF'
#!/bin/bash
# Run this script ON your server (100.81.165.23)

echo "🌐 Installing ZeroTier on server..."

# Install ZeroTier
curl -s https://install.zerotier.com | sudo bash

echo "✅ ZeroTier installed!"
echo ""
echo "📋 Next Steps:"
echo "1. Join your network: sudo zerotier-cli join YOUR_NETWORK_ID"
echo "2. Get node ID: sudo zerotier-cli info"
echo "3. Authorize in ZeroTier Central"
echo "4. Check assigned IP: sudo zerotier-cli listnetworks"
echo ""
echo "🔧 Example commands:"
echo "   sudo zerotier-cli join 1234567890abcdef"
echo "   sudo zerotier-cli info"
echo "   sudo zerotier-cli listnetworks"
EOF
    chmod +x zerotier-server-setup.sh
    echo "📄 Created zerotier-server-setup.sh"
}

# Function to create connection script
create_connection_script() {
    cat > connect-zerotier-ssh.sh << 'EOF'
#!/bin/bash
# Connect to your server via ZeroTier

echo "🌐 Connecting via ZeroTier..."

# Check ZeroTier status
if ! command -v zerotier-cli &> /dev/null; then
    echo "❌ ZeroTier not installed!"
    exit 1
fi

# Show network status
echo "📊 ZeroTier Status:"
sudo zerotier-cli listnetworks

echo ""
echo "🔍 Looking for your server..."

# Get ZeroTier IPs
NETWORKS=$(sudo zerotier-cli listnetworks | tail -n +2)
if [ -z "$NETWORKS" ]; then
    echo "❌ No ZeroTier networks found"
    echo "   Join a network first: sudo zerotier-cli join NETWORK_ID"
    exit 1
fi

echo "📋 Available ZeroTier devices:"
sudo zerotier-cli peers

echo ""
read -p "Enter your server's ZeroTier IP: " server_ip

if [ -n "$server_ip" ]; then
    echo "🔍 Testing connection to $server_ip..."
    if ping -c 1 "$server_ip" &> /dev/null; then
        echo "✅ Connection successful!"
        echo "🔐 Connecting to SSH..."
        ssh root@"$server_ip"
    else
        echo "❌ Cannot reach $server_ip"
        echo "   Check that both devices are authorized in ZeroTier Central"
    fi
else
    echo "❌ No server IP provided"
fi
EOF
    chmod +x connect-zerotier-ssh.sh
    echo "📄 Created connect-zerotier-ssh.sh"
}

# Function to create network setup guide
create_network_guide() {
    cat > zerotier-network-setup.md << 'EOF'
# ZeroTier Network Setup Guide

## 1. Create ZeroTier Account
- Go to: https://my.zerotier.com/
- Sign up for free account
- Free tier includes 25 devices

## 2. Create Network
- Click "Create A Network"
- Note the Network ID (16 characters)
- Configure network settings:
  - Access Control: Private (recommended)
  - IPv4 Auto-Assign: Enable
  - IPv6 Auto-Assign: Enable (optional)

## 3. Network Configuration
- Set IPv4 range (e.g., 192.168.192.0/24)
- Enable "Auto-Assign from Range"
- Save settings

## 4. Device Authorization
- Install ZeroTier on each device
- Join network: `sudo zerotier-cli join NETWORK_ID`
- Go to network page in ZeroTier Central
- Check the box to authorize each device
- Note assigned IP addresses

## 5. SSH Connection
- Use assigned ZeroTier IP for SSH
- Example: `ssh root@192.168.192.123`

## Troubleshooting
- Check network status: `sudo zerotier-cli listnetworks`
- Check peers: `sudo zerotier-cli peers`
- Verify authorization in ZeroTier Central
- Test connectivity: `ping [zerotier-ip]`
EOF
    echo "📄 Created zerotier-network-setup.md"
}

# Main execution
echo "ZeroTier provides:"
echo "✅ Free tier (25 devices)"
echo "✅ Managed service (no server setup)"
echo "✅ Easy web-based management"
echo "✅ Cross-platform support"
echo "✅ Works behind NAT/firewall"
echo "✅ Automatic IP assignment"
echo "❌ Requires third-party service"
echo "❌ Free tier device limit"
echo ""

read -p "Install and setup ZeroTier? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    install_zerotier
    if [ $? -eq 0 ]; then
        setup_zerotier
        create_server_script
        create_connection_script
        create_network_guide
        
        echo ""
        echo "✅ ZeroTier setup completed!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Copy zerotier-server-setup.sh to your server"
        echo "2. Run it: sudo bash zerotier-server-setup.sh"
        echo "3. Authorize both devices in ZeroTier Central"
        echo "4. Use connect-zerotier-ssh.sh to connect"
        echo ""
        echo "📖 Read zerotier-network-setup.md for detailed guide"
    fi
else
    echo "ℹ️  ZeroTier setup skipped"
fi
