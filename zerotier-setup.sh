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
