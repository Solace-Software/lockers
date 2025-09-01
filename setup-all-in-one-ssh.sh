#!/bin/bash

# All-in-One Free SSH Access Setup
# Combines multiple free solutions for maximum reliability
# Recommended approach for robust remote access

echo "🔧 All-in-One Free SSH Access Setup"
echo "==================================="

# Configuration
SERVER_IP="100.81.165.23"
SERVER_USER="root"

# Function to install prerequisites
install_prerequisites() {
    echo "📦 Installing prerequisites..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install wireguard-tools
            brew install --cask zerotier-one
        else
            echo "⚠️  Homebrew not found. Some features may not work."
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt update
        sudo apt install -y curl wget autossh wireguard-tools
        curl -s https://install.zerotier.com | sudo bash
    fi
}

# Function to setup WireGuard (Primary method)
setup_wireguard_primary() {
    echo "🔒 Setting up WireGuard (Primary method)..."
    
    # Generate keys
    wg genkey | tee client_private.key | wg pubkey > client_public.key
    wg genkey | tee server_private.key | wg pubkey > server_public.key
    
    CLIENT_PRIVATE=$(cat client_private.key)
    CLIENT_PUBLIC=$(cat client_public.key)
    SERVER_PRIVATE=$(cat server_private.key)
    SERVER_PUBLIC=$(cat server_public.key)
    
    # Create client config
    cat > wg0-primary.conf << EOF
[Interface]
PrivateKey = $CLIENT_PRIVATE
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = $SERVER_PUBLIC
Endpoint = $SERVER_IP:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

    # Create server config
    cat > wg0-server.conf << EOF
[Interface]
PrivateKey = $SERVER_PRIVATE
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

PostUp = echo 1 > /proc/sys/net/ipv4/ip_forward
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = $CLIENT_PUBLIC
AllowedIPs = 10.0.0.2/32
EOF

    echo "✅ WireGuard configured (Primary)"
}

# Function to setup ZeroTier (Backup method)
setup_zerotier_backup() {
    echo "🌐 Setting up ZeroTier (Backup method)..."
    
    echo "📋 ZeroTier setup:"
    echo "1. Create account at: https://my.zerotier.com/"
    echo "2. Create network and note Network ID"
    echo "3. Join network: sudo zerotier-cli join NETWORK_ID"
    echo "4. Authorize devices in ZeroTier Central"
    
    cat > zerotier-setup.sh << 'EOF'
#!/bin/bash
# ZeroTier backup setup

echo "🌐 ZeroTier Backup Setup"
read -p "Enter ZeroTier Network ID: " network_id

if [ -n "$network_id" ]; then
    sudo zerotier-cli join "$network_id"
    echo "✅ Joined network: $network_id"
    echo "📋 Authorize this device in ZeroTier Central"
    echo "🔍 Node ID: $(sudo zerotier-cli info | cut -d' ' -f3)"
fi
EOF
    chmod +x zerotier-setup.sh
    
    echo "✅ ZeroTier configured (Backup)"
}

# Function to setup SSH reverse tunnel (Emergency method)
setup_reverse_tunnel_emergency() {
    echo "🔄 Setting up SSH Reverse Tunnel (Emergency method)..."
    
    echo "📋 You'll need a free cloud shell or VPS:"
    echo "- Google Cloud Shell (free)"
    echo "- AWS CloudShell (free)"
    echo "- GitHub Codespaces (free tier)"
    
    read -p "Enter emergency server (optional): " emergency_server
    read -p "Enter emergency username (optional): " emergency_user
    
    if [ -n "$emergency_server" ] && [ -n "$emergency_user" ]; then
        cat > emergency-tunnel.sh << EOF
#!/bin/bash
# Emergency SSH tunnel

EMERGENCY_SERVER="$emergency_server"
EMERGENCY_USER="$emergency_user"
TUNNEL_PORT="2222"

echo "🚨 Starting emergency tunnel..."
autossh -M 0 -N -R \$TUNNEL_PORT:localhost:22 \\
    -o "ServerAliveInterval=30" \\
    -o "ServerAliveCountMax=3" \\
    \$EMERGENCY_USER@\$EMERGENCY_SERVER
EOF
        chmod +x emergency-tunnel.sh
        
        cat > connect-emergency.sh << EOF
#!/bin/bash
# Connect via emergency tunnel

ssh -t $emergency_user@$emergency_server "ssh root@localhost -p 2222"
EOF
        chmod +x connect-emergency.sh
    fi
    
    echo "✅ Emergency tunnel configured"
}

# Function to create unified connection script
create_unified_connection() {
    cat > connect-gym-server.sh << 'EOF'
#!/bin/bash
# Unified connection script - tries multiple methods

echo "🔗 Gym Lockers Server Connection"
echo "================================"

SERVER_IP="100.81.165.23"

# Method 1: WireGuard VPN (Primary)
try_wireguard() {
    echo "🔒 Trying WireGuard VPN..."
    if [ -f "wg0-primary.conf" ]; then
        sudo wg-quick up wg0-primary.conf 2>/dev/null
        if ping -c 1 10.0.0.1 &>/dev/null; then
            echo "✅ WireGuard connected!"
            ssh root@10.0.0.1
            sudo wg-quick down wg0-primary.conf
            return 0
        else
            sudo wg-quick down wg0-primary.conf 2>/dev/null
        fi
    fi
    echo "❌ WireGuard failed"
    return 1
}

# Method 2: ZeroTier (Backup)
try_zerotier() {
    echo "🌐 Trying ZeroTier..."
    if command -v zerotier-cli &>/dev/null; then
        NETWORKS=$(sudo zerotier-cli listnetworks | tail -n +2)
        if [ -n "$NETWORKS" ]; then
            echo "📋 ZeroTier networks found"
            read -p "Enter server ZeroTier IP: " zt_ip
            if [ -n "$zt_ip" ] && ping -c 1 "$zt_ip" &>/dev/null; then
                echo "✅ ZeroTier connected!"
                ssh root@"$zt_ip"
                return 0
            fi
        fi
    fi
    echo "❌ ZeroTier failed"
    return 1
}

# Method 3: Direct SSH (if accessible)
try_direct() {
    echo "🌐 Trying direct SSH..."
    if ping -c 1 "$SERVER_IP" &>/dev/null; then
        echo "✅ Direct connection available!"
        ssh root@"$SERVER_IP"
        return 0
    fi
    echo "❌ Direct connection failed"
    return 1
}

# Method 4: Emergency tunnel
try_emergency() {
    echo "🚨 Trying emergency tunnel..."
    if [ -f "connect-emergency.sh" ]; then
        ./connect-emergency.sh
        return 0
    fi
    echo "❌ Emergency tunnel not configured"
    return 1
}

# Try methods in order
echo "🔍 Attempting connection methods..."
echo ""

try_wireguard || try_zerotier || try_direct || try_emergency || {
    echo ""
    echo "❌ All connection methods failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check server is running"
    echo "2. Verify network connectivity"
    echo "3. Check VPN configurations"
    echo "4. Try manual connection methods"
    exit 1
}
EOF
    chmod +x connect-gym-server.sh
    echo "✅ Unified connection script created"
}

# Function to create server installation script
create_server_installation() {
    cat > install-all-methods-server.sh << 'EOF'
#!/bin/bash
# Install all SSH access methods on server

echo "🔧 Installing All SSH Access Methods on Server"
echo "=============================================="

# Update system
apt update
apt install -y curl wget autossh wireguard-tools ufw fail2ban

# 1. Setup WireGuard
echo "🔒 Setting up WireGuard..."
cp wg0-server.conf /etc/wireguard/wg0.conf
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

# 2. Setup ZeroTier
echo "🌐 Installing ZeroTier..."
curl -s https://install.zerotier.com | bash

# 3. Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 51820/udp  # WireGuard
ufw allow 9993/udp   # ZeroTier
ufw --force enable

# 4. Setup fail2ban
echo "🛡️  Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# 5. Display status
echo ""
echo "✅ Installation completed!"
echo ""
echo "📊 Service Status:"
echo "=================="
echo "WireGuard:"
wg show
echo ""
echo "ZeroTier:"
zerotier-cli info
echo ""
echo "Firewall:"
ufw status
echo ""
echo "🔗 Connection methods available:"
echo "1. WireGuard VPN: 10.0.0.1"
echo "2. ZeroTier: (check ZeroTier Central)"
echo "3. Direct SSH: 100.81.165.23"
echo ""
echo "📋 Next steps:"
echo "1. Join ZeroTier network: zerotier-cli join NETWORK_ID"
echo "2. Authorize in ZeroTier Central"
echo "3. Test connections from client"
EOF
    chmod +x install-all-methods-server.sh
    echo "✅ Server installation script created"
}

# Function to create monitoring script
create_monitoring_script() {
    cat > monitor-connections.sh << 'EOF'
#!/bin/bash
# Monitor all connection methods

echo "📊 Connection Methods Status"
echo "============================"

# WireGuard status
echo "🔒 WireGuard:"
if command -v wg &>/dev/null; then
    wg show 2>/dev/null || echo "   Not active"
else
    echo "   Not installed"
fi

echo ""

# ZeroTier status
echo "🌐 ZeroTier:"
if command -v zerotier-cli &>/dev/null; then
    sudo zerotier-cli listnetworks 2>/dev/null || echo "   No networks"
else
    echo "   Not installed"
fi

echo ""

# Direct connection test
echo "🌐 Direct Connection:"
if ping -c 1 100.81.165.23 &>/dev/null; then
    echo "   ✅ Reachable"
else
    echo "   ❌ Unreachable"
fi

echo ""

# Emergency tunnel status
echo "🚨 Emergency Tunnel:"
if pgrep -f "ssh.*-R" &>/dev/null; then
    echo "   ✅ Active"
else
    echo "   ❌ Not active"
fi

echo ""
echo "🔧 Quick Actions:"
echo "   Connect: ./connect-gym-server.sh"
echo "   WireGuard up: sudo wg-quick up wg0-primary.conf"
echo "   ZeroTier join: sudo zerotier-cli join NETWORK_ID"
EOF
    chmod +x monitor-connections.sh
    echo "✅ Monitoring script created"
}

# Function to create documentation
create_documentation() {
    cat > FREE-SSH-ACCESS-GUIDE.md << 'EOF'
# Free SSH Access Guide

## Overview
This setup provides multiple free alternatives to Tailscale for remote SSH access to your gym lockers server.

## Methods Included

### 1. WireGuard VPN (Primary) 🔒
- **Cost**: Completely free
- **Pros**: High performance, secure, self-hosted
- **Cons**: Manual setup required
- **Usage**: `sudo wg-quick up wg0-primary.conf`

### 2. ZeroTier (Backup) 🌐
- **Cost**: Free tier (25 devices)
- **Pros**: Easy management, web interface
- **Cons**: Third-party service, device limit
- **Usage**: Join network, authorize devices

### 3. SSH Reverse Tunnel (Emergency) 🔄
- **Cost**: Free (uses cloud shells)
- **Pros**: Works through any NAT
- **Cons**: Requires intermediate server
- **Usage**: `./emergency-tunnel.sh`

### 4. Direct SSH (Fallback) 🌐
- **Cost**: Free
- **Pros**: Simple, direct
- **Cons**: Requires port forwarding
- **Usage**: Standard SSH connection

## Quick Start

1. **Setup**: Run `./setup-all-in-one-ssh.sh`
2. **Server**: Copy and run `install-all-methods-server.sh` on server
3. **Connect**: Use `./connect-gym-server.sh`
4. **Monitor**: Check status with `./monitor-connections.sh`

## Connection Priority

The unified script tries methods in this order:
1. WireGuard VPN (fastest, most secure)
2. ZeroTier (managed, reliable)
3. Direct SSH (simple, if accessible)
4. Emergency tunnel (last resort)

## Troubleshooting

### WireGuard Issues
- Check firewall: `sudo ufw allow 51820/udp`
- Verify keys are correct
- Test server connectivity

### ZeroTier Issues
- Authorize devices in ZeroTier Central
- Check network configuration
- Verify both devices are online

### General Issues
- Check server is running
- Verify network connectivity
- Review firewall settings
- Check SSH service status

## Security Notes

- WireGuard provides the best security
- ZeroTier has built-in security features
- Direct SSH should use key authentication
- Emergency tunnels are for temporary use

## Maintenance

- Monitor connection status regularly
- Update configurations as needed
- Keep backup methods available
- Test all methods periodically

## Support

For issues:
1. Check the monitoring script output
2. Review connection logs
3. Test individual methods manually
4. Verify server-side configurations
EOF
    echo "✅ Documentation created"
}

# Main execution
echo "All-in-One setup provides:"
echo "✅ Multiple free alternatives"
echo "✅ Automatic failover"
echo "✅ Comprehensive monitoring"
echo "✅ Easy management"
echo "✅ Maximum reliability"
echo "❌ More complex initial setup"
echo ""

read -p "Install All-in-One SSH access? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    echo "🚀 Starting All-in-One setup..."
    
    install_prerequisites
    setup_wireguard_primary
    setup_zerotier_backup
    setup_reverse_tunnel_emergency
    create_unified_connection
    create_server_installation
    create_monitoring_script
    create_documentation
    
    echo ""
    echo "✅ All-in-One SSH access setup completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Copy install-all-methods-server.sh to your server"
    echo "2. Run on server: sudo bash install-all-methods-server.sh"
    echo "3. Configure ZeroTier network (if using)"
    echo "4. Test connection: ./connect-gym-server.sh"
    echo ""
    echo "🔧 Files created:"
    echo "   - connect-gym-server.sh (unified connection)"
    echo "   - monitor-connections.sh (status monitoring)"
    echo "   - install-all-methods-server.sh (server setup)"
    echo "   - FREE-SSH-ACCESS-GUIDE.md (documentation)"
    echo ""
    echo "📖 Read FREE-SSH-ACCESS-GUIDE.md for detailed instructions"
else
    echo "ℹ️  All-in-One setup skipped"
fi
