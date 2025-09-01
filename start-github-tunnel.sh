#!/bin/bash
# Run this ON your server to create tunnel via GitHub Codespaces

echo "🔄 Starting GitHub Codespaces tunnel..."
read -p "Enter your GitHub Codespaces hostname (e.g., username-repo-12345.github.dev): " codespace_host

if [ -n "$codespace_host" ]; then
    echo "🔗 Creating tunnel to $codespace_host..."
    ssh -R 2222:localhost:22 -o StrictHostKeyChecking=no root@"$codespace_host"
else
    echo "❌ No codespace hostname provided"
fi
