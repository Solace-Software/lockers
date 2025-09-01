#!/bin/bash

# Remote SSH Connection Script
# Use this script to connect to your Gym Lockers server from anywhere
# Updated with free alternatives to Tailscale

# Configuration
SERVER_LOCAL_IP="192.168.10.31"
SERVER_PUBLIC_IP="100.81.165.23"  # Updated with actual server IP
SSH_PORT="22"
SSH_USER="root"

echo "🌐 Gym Lockers Remote SSH Connection"
echo "===================================="
echo "🆓 Free alternatives to Tailscale available!"
echo ""

# Function to test connection
test_connection() {
    local host=$1
    local port=$2
    echo "🔍 Testing connection to $host:$port..."
    
    # Test if port is open
    if timeout 5 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
        echo "✅ Port $port is open on $host"
        return 0
    else
        echo "❌ Port $port is closed or unreachable on $host"
        return 1
    fi
}

# Function to connect via SSH
connect_ssh() {
    local host=$1
    local user=$2
    local port=$3
    
    echo "🔐 Connecting to $user@$host:$port..."
    echo "💡 Tip: Use Ctrl+D or type 'exit' to disconnect"
    echo ""
    
    # SSH with various options for better connectivity
    ssh -o ConnectTimeout=10 \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o StrictHostKeyChecking=no \
        -p "$port" \
        "$user@$host"
}

# Main menu
echo "Select connection method:"
echo "1. Connect via Public IP (from internet)"
echo "2. Connect via Local IP (same network)"
echo "3. Test connectivity first"
echo "4. Setup SSH key authentication"
echo "5. Show connection info"
echo "6. 🆓 Setup free alternatives to Tailscale"
echo "7. 🔗 Use unified connection (all methods)"
echo ""
read -p "Enter choice (1-7): " choice

case $choice in
    1)
        echo "🌍 Connecting via Public IP..."
        if test_connection "$SERVER_PUBLIC_IP" "$SSH_PORT"; then
            connect_ssh "$SERVER_PUBLIC_IP" "$SSH_USER" "$SSH_PORT"
        else
            echo "❌ Cannot reach server via public IP. Check:"
            echo "   - Router port forwarding (port $SSH_PORT → $SERVER_LOCAL_IP:$SSH_PORT)"
            echo "   - Server firewall settings"
            echo "   - Public IP address ($SERVER_PUBLIC_IP)"
        fi
        ;;
    2)
        echo "🏠 Connecting via Local IP..."
        if test_connection "$SERVER_LOCAL_IP" "$SSH_PORT"; then
            connect_ssh "$SERVER_LOCAL_IP" "$SSH_USER" "$SSH_PORT"
        else
            echo "❌ Cannot reach server via local IP. Check:"
            echo "   - Server is running and accessible"
            echo "   - SSH service is enabled"
            echo "   - You're on the same network"
        fi
        ;;
    3)
        echo "🔍 Testing connectivity..."
        echo ""
        echo "Testing local connection:"
        test_connection "$SERVER_LOCAL_IP" "$SSH_PORT"
        echo ""
        echo "Testing public connection:"
        test_connection "$SERVER_PUBLIC_IP" "$SSH_PORT"
        echo ""
        echo "Current public IP:"
        curl -s ifconfig.me && echo ""
        ;;
    4)
        echo "🔑 Setting up SSH key authentication..."
        echo ""
        echo "1. Generate SSH key pair (if you don't have one):"
        echo "   ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'"
        echo ""
        echo "2. Copy public key to server:"
        echo "   ssh-copy-id $SSH_USER@$SERVER_PUBLIC_IP"
        echo "   OR"
        echo "   ssh-copy-id $SSH_USER@$SERVER_LOCAL_IP"
        echo ""
        echo "3. Test passwordless login:"
        echo "   ssh $SSH_USER@$SERVER_PUBLIC_IP"
        echo ""
        read -p "Generate SSH key now? (y/n): " generate_key
        if [[ $generate_key =~ ^[Yy]$ ]]; then
            ssh-keygen -t rsa -b 4096 -C "$(whoami)@$(hostname)"
        fi
        ;;
    5)
        echo "📋 Connection Information:"
        echo "========================="
        echo "Local IP:     $SERVER_LOCAL_IP"
        echo "Public IP:    $SERVER_PUBLIC_IP"
        echo "SSH Port:     $SSH_PORT"
        echo "SSH User:     $SSH_USER"
        echo ""
        echo "🌍 Remote Connection Command:"
        echo "ssh $SSH_USER@$SERVER_PUBLIC_IP"
        echo ""
        echo "🏠 Local Connection Command:"
        echo "ssh $SSH_USER@$SERVER_LOCAL_IP"
        echo ""
        echo "🔧 Gym Lockers Web Interface:"
        echo "Local:  http://$SERVER_LOCAL_IP:3001"
        echo "Remote: http://$SERVER_PUBLIC_IP:3001 (if port forwarded)"
        ;;
    6)
        echo "🆓 Setting up free alternatives to Tailscale..."
        if [ -f "./setup-free-remote-ssh.sh" ]; then
            ./setup-free-remote-ssh.sh
        else
            echo "❌ setup-free-remote-ssh.sh not found"
            echo "📥 Available alternatives:"
            echo "   - WireGuard VPN (self-hosted)"
            echo "   - ZeroTier (free tier)"
            echo "   - SSH Reverse Tunnel"
            echo "   - Dynamic DNS + Port Forwarding"
            echo "   - Cloudflare Tunnel"
        fi
        ;;
    7)
        echo "🔗 Using unified connection..."
        if [ -f "./connect-gym-server.sh" ]; then
            ./connect-gym-server.sh
        else
            echo "❌ Unified connection script not found"
            echo "💡 Run setup-all-in-one-ssh.sh first"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
