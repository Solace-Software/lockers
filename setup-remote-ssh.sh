#!/bin/bash

# Remote SSH Setup Script for Gym Lockers Server
# Run this script ON the server (192.168.10.31)

echo "🔐 Setting up Remote SSH Access for Gym Lockers Server..."

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root or with sudo"
    exit 1
fi

# 1. Install SSH server if not present
echo "📦 Installing OpenSSH Server..."
apt update
apt install -y openssh-server

# 2. Backup original SSH config
echo "📋 Backing up SSH configuration..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d)

# 3. Configure SSH for security
echo "🔧 Configuring SSH for remote access..."
cat > /etc/ssh/sshd_config << 'EOF'
# SSH Configuration for Remote Access
Port 22
Protocol 2

# Authentication
PermitRootLogin yes
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no

# Security Settings
X11Forwarding no
UsePAM yes
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server

# Allow specific users (customize as needed)
# AllowUsers yourusername

# Disable unused authentication methods
KerberosAuthentication no
GSSAPIAuthentication no

# Connection settings
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 4

# Logging
SyslogFacility AUTH
LogLevel INFO
EOF

# 4. Set up firewall rules
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 22/tcp
ufw allow 3001/tcp  # For gym lockers web interface
ufw allow 1883/tcp  # For MQTT
ufw allow 80/tcp    # For HTTP
ufw allow 443/tcp   # For HTTPS

# 5. Enable and start SSH service
echo "🚀 Starting SSH service..."
systemctl enable ssh
systemctl restart ssh

# 6. Create SSH key directory for remote access
echo "🔑 Setting up SSH key authentication..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 7. Install fail2ban for security
echo "🛡️  Installing fail2ban for security..."
apt install -y fail2ban

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 8. Display current network configuration
echo "📡 Current Network Configuration:"
echo "=================================="
ip addr show | grep inet
echo ""
echo "🔌 SSH Service Status:"
systemctl status ssh --no-pager
echo ""
echo "🔥 Firewall Status:"
ufw status
echo ""
echo "✅ Remote SSH setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure port forwarding on your router:"
echo "   - External Port: 22 → Internal IP: $(hostname -I | awk '{print $1}') → Internal Port: 22"
echo "2. Your public IP is: $(curl -s ifconfig.me 2>/dev/null || echo 'Check manually')"
echo "3. Test connection: ssh root@YOUR_PUBLIC_IP"
echo "4. Consider setting up SSH key authentication for better security"
echo ""
echo "🔐 To generate SSH keys for passwordless login:"
echo "   ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'"
echo "   ssh-copy-id root@YOUR_PUBLIC_IP"
EOF
