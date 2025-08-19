#!/bin/bash

# Cloudflare Tunnel Setup for SSH Access
# Enterprise-grade solution, free tier available

echo "☁️  Setting up Cloudflare Tunnel for SSH"
echo "=========================================="

# Function to install cloudflared
install_cloudflared() {
    echo "📦 Installing cloudflared..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install cloudflared
        else
            echo "📥 Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared-linux-amd64.deb
        rm cloudflared-linux-amd64.deb
    else
        echo "❌ Unsupported OS"
        return 1
    fi
}

# Function to setup tunnel
setup_tunnel() {
    echo "⚙️  Setting up Cloudflare Tunnel..."
    echo ""
    echo "🔑 You need a Cloudflare account (free):"
    echo "   1. Sign up at: https://dash.cloudflare.com/sign-up"
    echo "   2. Add a domain (or use Cloudflare's subdomain)"
    echo ""
    echo "📋 Setup steps:"
    echo "   1. cloudflared tunnel login"
    echo "   2. cloudflared tunnel create gym-lockers"
    echo "   3. Configure tunnel for SSH access"
    echo ""
    
    read -p "Continue with setup? (y/n): " continue_setup
    if [[ $continue_setup =~ ^[Yy]$ ]]; then
        echo "🔐 Logging into Cloudflare..."
        cloudflared tunnel login
        
        echo "🚇 Creating tunnel..."
        cloudflared tunnel create gym-lockers-ssh
        
        # Create config file
        echo "📄 Creating tunnel configuration..."
        mkdir -p ~/.cloudflared
        cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: gym-lockers-ssh
credentials-file: ~/.cloudflared/gym-lockers-ssh.json

ingress:
  - hostname: ssh.yourdomain.com
    service: ssh://192.168.10.31:22
  - service: http_status:404
EOF
        
        echo "✅ Tunnel configured!"
        echo ""
        echo "📋 Final steps:"
        echo "1. Update config.yml with your domain"
        echo "2. Create DNS record: cloudflared tunnel route dns gym-lockers-ssh ssh.yourdomain.com"
        echo "3. Start tunnel: cloudflared tunnel run gym-lockers-ssh"
        echo "4. Connect: ssh root@ssh.yourdomain.com"
    fi
}

# Create server installation script
create_server_script() {
    cat > cloudflare-tunnel-server.sh << 'EOF'
#!/bin/bash
# Install cloudflared on your server

echo "☁️  Installing Cloudflare Tunnel on server..."

# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

echo "✅ Cloudflared installed!"
echo "📋 Next: Transfer tunnel credentials and config from your client"
EOF
    chmod +x cloudflare-tunnel-server.sh
}

# Main execution
echo "Cloudflare Tunnel provides:"
echo "✅ Custom domain (ssh.yourdomain.com)"
echo "✅ DDoS protection"
echo "✅ No port forwarding needed"
echo "✅ Enterprise security"
echo "✅ Free tier available"
echo "❌ Requires domain setup"
echo "❌ More complex initial setup"
echo ""

read -p "Install Cloudflare Tunnel? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    install_cloudflared && setup_tunnel && create_server_script
else
    echo "ℹ️  Manual setup guide: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/"
fi
