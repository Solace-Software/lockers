#!/bin/bash
# Test all available connection methods

echo "🔍 Testing All Connection Methods"
echo "================================="

# Test WireGuard
echo "🔒 Testing WireGuard..."
if [ -f "wg0-primary.conf" ]; then
    sudo wg-quick up wg0-primary.conf 2>/dev/null
    if ping -c 1 10.0.0.1 &>/dev/null; then
        echo "✅ WireGuard: Working"
        sudo wg-quick down wg0-primary.conf 2>/dev/null
    else
        echo "❌ WireGuard: Failed"
        sudo wg-quick down wg0-primary.conf 2>/dev/null
    fi
else
    echo "⚠️  WireGuard: Not configured"
fi

# Test direct SSH
echo "🌐 Testing direct SSH..."
if ping -c 1 100.81.165.23 &>/dev/null; then
    echo "✅ Direct SSH: Server reachable"
else
    echo "❌ Direct SSH: Server unreachable"
fi

# Test Tailscale (if still active)
echo "🔗 Testing Tailscale..."
if command -v tailscale &>/dev/null && tailscale status &>/dev/null; then
    echo "✅ Tailscale: Still active"
else
    echo "❌ Tailscale: Not active"
fi

echo ""
echo "📋 Available connection scripts:"
ls -1 connect-*.sh 2>/dev/null || echo "No connection scripts found"
