#!/bin/bash

# Tailscale Setup Script for Remote SSH Access
# Works without port forwarding and handles dynamic IPs automatically

echo "🔗 Setting up Tailscale for Remote SSH Access"
echo "=============================================="

# Function to install Tailscale on different systems
install_tailscale() {
    echo "📦 Installing Tailscale..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "🍎 Installing on macOS..."
        if command -v brew &> /dev/null; then
            brew install tailscale
        else
            echo "📥 Please download Tailscale from: https://tailscale.com/download/mac"
            echo "   Or install Homebrew first: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            return 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "🐧 Installing on Linux..."
        curl -fsSL https://tailscale.com/install.sh | sh
    else
        echo "❌ Unsupported OS. Please install manually from https://tailscale.com/download"
        return 1
    fi
}

# Function to set up Tailscale
setup_tailscale() {
    echo "⚙️  Setting up Tailscale..."
    
    # Start Tailscale
    sudo tailscale up
    
    echo ""
    echo "✅ Tailscale setup completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Install Tailscale on your server (192.168.10.31)"
    echo "2. Run 'sudo tailscale up' on the server"
    echo "3. Both devices will get Tailscale IPs (100.x.x.x)"
    echo "4. SSH using: ssh root@[server-tailscale-ip]"
    echo ""
    echo "🔍 To see Tailscale status:"
    echo "   tailscale status"
    echo ""
    echo "🌐 To see your Tailscale IP:"
    echo "   tailscale ip -4"
}

# Main execution
echo "Tailscale provides:"
echo "✅ No port forwarding needed"
echo "✅ Works with dynamic IPs"
echo "✅ Encrypted mesh VPN"
echo "✅ Free for personal use (up to 20 devices)"
echo "✅ Works behind NAT/firewall"
echo ""

read -p "Install and setup Tailscale? (y/n): " choice
if [[ $choice =~ ^[Yy]$ ]]; then
    install_tailscale && setup_tailscale
else
    echo "ℹ️  Manual installation:"
    echo "   Visit: https://tailscale.com/download"
    echo "   Then run: sudo tailscale up"
fi

echo ""
echo "📖 For server installation, run this on your server:"
echo "   curl -fsSL https://tailscale.com/install.sh | sh"
echo "   sudo tailscale up"
