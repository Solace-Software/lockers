#!/bin/bash

# Simple Direct SSH Setup
# Run this script to copy to your server and enable direct SSH access

echo "🔐 Simple SSH Access Setup"
echo "=========================="

SERVER_IP="100.81.165.23"

# Create server setup script
cat > enable-ssh-server.sh << 'EOF'
#!/bin/bash
# Run this ON your server to enable direct SSH access

echo "🔐 Enabling SSH Access on Server"
echo "================================"

# Ensure SSH is installed and running
echo "📦 Installing/starting SSH service..."
apt update
apt install -y openssh-server

# Start and enable SSH
systemctl start ssh
systemctl enable ssh

# Configure firewall to allow SSH
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 22/tcp
ufw --force enable

# Show current network info
echo "📡 Network Information:"
echo "======================"
ip addr show | grep inet
echo ""
echo "🔌 SSH Service Status:"
systemctl status ssh --no-pager -l
echo ""
echo "🔥 Firewall Status:"
ufw status
echo ""

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Could not determine")
echo "🌐 Your public IP: $PUBLIC_IP"
echo ""
echo "✅ SSH is now enabled!"
echo ""
echo "🔗 Connection commands:"
echo "   Local network: ssh root@$(hostname -I | awk '{print $1}')"
echo "   Public access: ssh root@$PUBLIC_IP"
echo ""
echo "⚠️  Note: For public access, you may need to configure"
echo "   port forwarding on your router (port 22)"
EOF

echo "📄 Created server setup script: enable-ssh-server.sh"
echo ""
echo "🚀 Next Steps:"
echo "1. Copy script to server via Tailscale"
echo "2. Run script on server"
echo "3. Test direct SSH connection"
echo ""

# Copy to server function
copy_to_server() {
    echo "📤 Copying setup script to server..."
    scp enable-ssh-server.sh root@$SERVER_IP:/root/
    
    if [ $? -eq 0 ]; then
        echo "✅ Script copied successfully!"
        echo ""
        echo "🔗 Now SSH to your server and run:"
        echo "   ssh root@$SERVER_IP"
        echo "   bash /root/enable-ssh-server.sh"
    else
        echo "❌ Failed to copy script"
        echo "💡 Make sure Tailscale is still working"
    fi
}

read -p "Copy script to server now? (y/n): " copy_choice
if [[ $copy_choice =~ ^[Yy]$ ]]; then
    copy_to_server
else
    echo "ℹ️  Manual copy: scp enable-ssh-server.sh root@$SERVER_IP:/root/"
fi
