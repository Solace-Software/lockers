#!/bin/bash

# Quick backup access without sudo requirements
# Run this on your server via Tailscale SSH

echo "🚨 Quick Backup SSH Access Setup"
echo "================================"

# Method 1: SSH key authentication
setup_ssh_keys() {
    echo "🔑 Setting up SSH key authentication..."
    
    # Generate SSH key if it doesn't exist
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -b 4096 -C "backup-access-$(date)" -f ~/.ssh/id_rsa -N ""
        echo "✅ SSH key generated"
    fi
    
    echo "📋 Your public key (copy this):"
    cat ~/.ssh/id_rsa.pub
    echo ""
    echo "📝 Add this key to your server's ~/.ssh/authorized_keys"
}

# Method 2: DuckDNS setup
setup_duckdns_server() {
    echo "🦆 Setting up DuckDNS on server..."
    
    read -p "Enter your DuckDNS domain: " domain
    read -p "Enter your DuckDNS token: " token
    
    if [ -n "$domain" ] && [ -n "$token" ]; then
        # Create update script
        cat > /root/update-duckdns.sh << EOF
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=$domain&token=$token&ip="
echo "Updated $domain.duckdns.org to current IP"
EOF
        chmod +x /root/update-duckdns.sh
        
        # Run initial update
        /root/update-duckdns.sh
        
        # Add to crontab for automatic updates
        (crontab -l 2>/dev/null; echo "*/5 * * * * /root/update-duckdns.sh") | crontab -
        
        echo "✅ DuckDNS configured: $domain.duckdns.org"
        echo "🔗 SSH command: ssh root@$domain.duckdns.org"
    fi
}

# Method 3: Simple port checking
check_ssh_access() {
    echo "🔍 Checking SSH access..."
    
    # Get current public IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unknown")
    echo "📡 Public IP: $PUBLIC_IP"
    
    # Check SSH service
    if systemctl is-active --quiet ssh; then
        echo "✅ SSH service is running"
    else
        echo "⚠️  Starting SSH service..."
        systemctl start ssh
        systemctl enable ssh
    fi
    
    # Check firewall
    echo "🔥 Firewall status:"
    ufw status
    
    echo ""
    echo "📋 Direct SSH test command:"
    echo "ssh root@$PUBLIC_IP"
}

echo "Choose backup method:"
echo "1. Setup SSH keys"
echo "2. Setup DuckDNS"
echo "3. Check current SSH access"
echo "4. All of the above"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1) setup_ssh_keys ;;
    2) setup_duckdns_server ;;
    3) check_ssh_access ;;
    4) 
        setup_ssh_keys
        echo ""
        setup_duckdns_server
        echo ""
        check_ssh_access
        ;;
    *) echo "Invalid choice" ;;
esac

echo ""
echo "✅ Backup access setup completed!"
echo "🚨 Test these methods BEFORE Tailscale expires!"
