#!/bin/bash

# Dynamic DNS + Port Forwarding Setup
# Free solution using Dynamic DNS services
# Works with home routers and dynamic IPs

echo "📡 Dynamic DNS + Port Forwarding Setup"
echo "======================================"

# Function to setup Dynamic DNS
setup_dynamic_dns() {
    echo "⚙️  Setting up Dynamic DNS..."
    echo ""
    echo "🌐 Free Dynamic DNS Providers:"
    echo "1. No-IP (free subdomain)"
    echo "2. DuckDNS (free subdomain)"
    echo "3. Dynu (free subdomain)"
    echo "4. FreeDNS (free subdomain)"
    echo ""
    
    read -p "Select provider (1-4): " provider_choice
    
    case $provider_choice in
        1) setup_noip ;;
        2) setup_duckdns ;;
        3) setup_dynu ;;
        4) setup_freedns ;;
        *) echo "❌ Invalid choice"; return 1 ;;
    esac
}

# Function to setup No-IP
setup_noip() {
    echo "🌐 Setting up No-IP Dynamic DNS..."
    echo ""
    echo "📋 Steps:"
    echo "1. Sign up at: https://www.noip.com/"
    echo "2. Create a hostname (e.g., yourname.ddns.net)"
    echo "3. Install No-IP client or configure router"
    echo ""
    
    read -p "Enter your No-IP hostname: " hostname
    read -p "Enter your No-IP username: " username
    read -p "Enter your No-IP password: " password
    
    if [ -n "$hostname" ] && [ -n "$username" ] && [ -n "$password" ]; then
        create_noip_client "$hostname" "$username" "$password"
    fi
}

# Function to setup DuckDNS
setup_duckdns() {
    echo "🦆 Setting up DuckDNS..."
    echo ""
    echo "📋 Steps:"
    echo "1. Sign up at: https://www.duckdns.org/"
    echo "2. Create a subdomain (e.g., yourname.duckdns.org)"
    echo "3. Get your token"
    echo ""
    
    read -p "Enter your DuckDNS domain (without .duckdns.org): " domain
    read -p "Enter your DuckDNS token: " token
    
    if [ -n "$domain" ] && [ -n "$token" ]; then
        create_duckdns_client "$domain" "$token"
    fi
}

# Function to setup Dynu
setup_dynu() {
    echo "🌐 Setting up Dynu..."
    echo ""
    echo "📋 Steps:"
    echo "1. Sign up at: https://www.dynu.com/"
    echo "2. Create a hostname"
    echo "3. Get API credentials"
    echo ""
    
    read -p "Enter your Dynu hostname: " hostname
    read -p "Enter your Dynu username: " username
    read -p "Enter your Dynu password: " password
    
    if [ -n "$hostname" ] && [ -n "$username" ] && [ -n "$password" ]; then
        create_dynu_client "$hostname" "$username" "$password"
    fi
}

# Function to setup FreeDNS
setup_freedns() {
    echo "🆓 Setting up FreeDNS..."
    echo ""
    echo "📋 Steps:"
    echo "1. Sign up at: https://freedns.afraid.org/"
    echo "2. Create a subdomain"
    echo "3. Get update URL"
    echo ""
    
    read -p "Enter your FreeDNS update URL: " update_url
    
    if [ -n "$update_url" ]; then
        create_freedns_client "$update_url"
    fi
}

# Function to create No-IP client
create_noip_client() {
    local hostname=$1
    local username=$2
    local password=$3
    
    cat > update-noip.sh << EOF
#!/bin/bash
# No-IP Dynamic DNS updater

HOSTNAME="$hostname"
USERNAME="$username"
PASSWORD="$password"

# Get current IP
CURRENT_IP=\$(curl -s ifconfig.me)

# Update No-IP
curl -s "http://\$USERNAME:\$PASSWORD@dynupdate.no-ip.com/nic/update?hostname=\$HOSTNAME&myip=\$CURRENT_IP"

echo "Updated \$HOSTNAME to \$CURRENT_IP"
EOF
    chmod +x update-noip.sh
    
    # Create systemd service
    create_ddns_service "update-noip.sh"
    echo "✅ No-IP client created"
}

# Function to create DuckDNS client
create_duckdns_client() {
    local domain=$1
    local token=$2
    
    cat > update-duckdns.sh << EOF
#!/bin/bash
# DuckDNS updater

DOMAIN="$domain"
TOKEN="$token"

# Update DuckDNS
curl -s "https://www.duckdns.org/update?domains=\$DOMAIN&token=\$TOKEN&ip="

echo "Updated \$DOMAIN.duckdns.org"
EOF
    chmod +x update-duckdns.sh
    
    create_ddns_service "update-duckdns.sh"
    echo "✅ DuckDNS client created"
}

# Function to create Dynu client
create_dynu_client() {
    local hostname=$1
    local username=$2
    local password=$3
    
    cat > update-dynu.sh << EOF
#!/bin/bash
# Dynu Dynamic DNS updater

HOSTNAME="$hostname"
USERNAME="$username"
PASSWORD="$password"

# Get current IP
CURRENT_IP=\$(curl -s ifconfig.me)

# Update Dynu
curl -s "https://api.dynu.com/nic/update?hostname=\$HOSTNAME&myip=\$CURRENT_IP" \\
    -u "\$USERNAME:\$PASSWORD"

echo "Updated \$HOSTNAME to \$CURRENT_IP"
EOF
    chmod +x update-dynu.sh
    
    create_ddns_service "update-dynu.sh"
    echo "✅ Dynu client created"
}

# Function to create FreeDNS client
create_freedns_client() {
    local update_url=$1
    
    cat > update-freedns.sh << EOF
#!/bin/bash
# FreeDNS updater

UPDATE_URL="$update_url"

# Update FreeDNS
curl -s "\$UPDATE_URL"

echo "Updated FreeDNS"
EOF
    chmod +x update-freedns.sh
    
    create_ddns_service "update-freedns.sh"
    echo "✅ FreeDNS client created"
}

# Function to create systemd service for DDNS
create_ddns_service() {
    local script_name=$1
    
    cat > ddns-updater.service << EOF
[Unit]
Description=Dynamic DNS Updater
After=network.target

[Service]
Type=oneshot
ExecStart=/root/$script_name

[Install]
WantedBy=multi-user.target
EOF

    cat > ddns-updater.timer << EOF
[Unit]
Description=Run Dynamic DNS Updater every 5 minutes
Requires=ddns-updater.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF

    echo "📄 Created systemd service and timer"
}

# Function to create port forwarding guide
create_port_forwarding_guide() {
    cat > port-forwarding-guide.md << 'EOF'
# Router Port Forwarding Setup Guide

## 1. Access Router Admin Panel
- Open web browser
- Go to router IP (usually 192.168.1.1 or 192.168.0.1)
- Login with admin credentials

## 2. Find Port Forwarding Section
Common menu locations:
- Advanced → Port Forwarding
- NAT → Port Forwarding
- Firewall → Port Forwarding
- Gaming → Port Forwarding

## 3. Create Port Forwarding Rule
- Service Name: SSH
- External Port: 22 (or custom port like 2222)
- Internal IP: 100.81.165.23 (your server)
- Internal Port: 22
- Protocol: TCP
- Enable: Yes

## 4. Additional Ports (Optional)
- Port 3001: Gym Lockers Web Interface
- Port 1883: MQTT
- Port 80: HTTP
- Port 443: HTTPS

## 5. Save and Reboot Router
- Save settings
- Reboot router
- Test connection

## Security Considerations
- Change default SSH port (22 → 2222)
- Use SSH key authentication
- Enable fail2ban
- Consider VPN instead of direct exposure

## Testing Connection
```bash
# Test from outside your network
ssh root@yourdomain.ddns.net -p 22

# Test specific port
telnet yourdomain.ddns.net 22
```

## Troubleshooting
- Check router firewall settings
- Verify internal IP is correct
- Test from outside your network
- Check ISP doesn't block ports
- Verify DDNS is updating correctly
EOF
    echo "📄 Created port-forwarding-guide.md"
}

# Function to create connection script
create_connection_script() {
    cat > connect-ddns-ssh.sh << 'EOF'
#!/bin/bash
# Connect via Dynamic DNS

echo "📡 Connecting via Dynamic DNS..."

# Configuration (update these)
DDNS_HOSTNAME="your-hostname.ddns.net"
SSH_PORT="22"
SSH_USER="root"

echo "🔍 Resolving $DDNS_HOSTNAME..."
RESOLVED_IP=$(nslookup $DDNS_HOSTNAME | grep -A1 "Name:" | tail -1 | awk '{print $2}')

if [ -n "$RESOLVED_IP" ]; then
    echo "✅ Resolved to: $RESOLVED_IP"
    echo "🔐 Connecting to SSH..."
    ssh -p $SSH_PORT $SSH_USER@$DDNS_HOSTNAME
else
    echo "❌ Could not resolve hostname"
    echo "   Check DDNS configuration"
fi
EOF
    chmod +x connect-ddns-ssh.sh
    echo "📄 Created connect-ddns-ssh.sh"
}

# Function to create server installation script
create_server_install() {
    cat > install-ddns-server.sh << 'EOF'
#!/bin/bash
# Install DDNS updater on server

echo "📡 Installing Dynamic DNS updater on server..."

# Install required packages
apt update
apt install -y curl

# Copy updater script
cp update-*.sh /root/

# Install systemd service
cp ddns-updater.service /etc/systemd/system/
cp ddns-updater.timer /etc/systemd/system/

# Enable and start
systemctl daemon-reload
systemctl enable ddns-updater.timer
systemctl start ddns-updater.timer

echo "✅ DDNS updater installed!"
echo "📊 Timer status:"
systemctl status ddns-updater.timer

echo ""
echo "🔧 Commands:"
echo "   Status: systemctl status ddns-updater.timer"
echo "   Logs:   journalctl -u ddns-updater.service"
echo "   Test:   systemctl start ddns-updater.service"
EOF
    chmod +x install-ddns-server.sh
    echo "📄 Created install-ddns-server.sh"
}

# Main execution
echo "Dynamic DNS + Port Forwarding provides:"
echo "✅ Completely free"
echo "✅ Custom domain name"
echo "✅ Works with dynamic IPs"
echo "✅ No third-party VPN service"
echo "❌ Requires router configuration"
echo "❌ Exposes server to internet"
echo "❌ Security considerations"
echo ""

read -p "Setup Dynamic DNS? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    setup_dynamic_dns
    create_port_forwarding_guide
    create_connection_script
    create_server_install
    
    echo ""
    echo "✅ Dynamic DNS setup completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure port forwarding on your router"
    echo "2. Copy scripts to your server"
    echo "3. Install: sudo bash install-ddns-server.sh"
    echo "4. Test connection: ./connect-ddns-ssh.sh"
    echo ""
    echo "📖 Read port-forwarding-guide.md for router setup"
    echo ""
    echo "⚠️  Security Warning:"
    echo "   This exposes your server to the internet"
    echo "   Consider using SSH keys and fail2ban"
else
    echo "ℹ️  Dynamic DNS setup skipped"
fi
