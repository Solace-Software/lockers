#!/bin/bash
# Connect via GitHub Codespaces tunnel

read -p "Enter your GitHub Codespaces hostname: " codespace_host
if [ -n "$codespace_host" ]; then
    echo "🔗 Connecting via $codespace_host..."
    ssh -t root@"$codespace_host" "ssh root@localhost -p 2222"
else
    echo "❌ No codespace hostname provided"
fi
