#!/bin/bash
# Quick DuckDNS setup

echo "🦆 DuckDNS Setup"
echo "==============="
echo "1. Sign up at: https://www.duckdns.org/"
echo "2. Create a subdomain"
echo "3. Get your token"
echo ""

read -p "Enter your DuckDNS domain (without .duckdns.org): " domain
read -p "Enter your DuckDNS token: " token

if [ -n "$domain" ] && [ -n "$token" ]; then
    # Create update script
    cat > update-duckdns.sh << EOL
#!/bin/bash
curl -s "https://www.duckdns.org/update?domains=$domain&token=$token&ip="
echo "Updated $domain.duckdns.org"
EOL
    chmod +x update-duckdns.sh
    
    # Run initial update
    ./update-duckdns.sh
    
    echo "✅ DuckDNS configured!"
    echo "🌐 Your domain: $domain.duckdns.org"
    echo "🔗 SSH command: ssh root@$domain.duckdns.org"
    echo ""
    echo "📋 Setup port forwarding on your router:"
    echo "   External Port: 22 -> Internal IP: 100.81.165.23 -> Internal Port: 22"
else
    echo "❌ Missing domain or token"
fi
