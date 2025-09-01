# INZAN Gym Lockers Server Access Guide

## 🏋️ Server Information
- **Server Name**: INZAN Gym Lockers
- **Server IP**: 100.81.165.23
- **SSH User**: root
- **Location**: Remote server deployment

## 🔗 Connection Methods

### Primary Method: ngrok Tunnel ✅
```bash
ssh root@0.tcp.eu.ngrok.io -p 15515
```
- **Status**: Active and working
- **Pros**: Works from anywhere, no router setup needed
- **Cons**: Requires ngrok to be running on server

### Backup Method: Direct SSH
```bash
ssh root@100.81.165.23
```
- **Status**: May be blocked by firewall
- **Pros**: Direct connection, no third-party service
- **Cons**: Requires router/firewall configuration

## 🚀 Quick Access

### Use the INZAN Access Script:
```bash
./INZAN-SSH-ACCESS.sh
```
This script provides:
1. ngrok tunnel connection (recommended)
2. Direct IP connection attempt
3. Server management tools
4. Connection status checking
5. Emergency troubleshooting

## 🔧 Server Management Commands

Once connected to the server:

### Docker Services
```bash
# Check running containers
docker ps

# Restart gym lockers
docker-compose restart

# View logs
docker logs gym-lockers-backend
docker logs gym-lockers-frontend

# Full restart
docker-compose down && docker-compose up -d
```

### ngrok Management
```bash
# Start new ngrok tunnel (if current one stops)
ngrok tcp 22

# Check ngrok status
curl http://localhost:4040/api/tunnels
```

### System Status
```bash
# Check SSH service
systemctl status ssh

# Check firewall
ufw status

# Check system resources
htop
df -h
```

## 🆘 Troubleshooting

### If ngrok tunnel stops working:
1. SSH to server via any available method
2. Run: `ngrok tcp 22`
3. Note the new forwarding address
4. Update connection details

### If completely locked out:
1. Check if Tailscale is still active
2. Try physical access to server location
3. Contact hosting provider support

### Connection Test Commands:
```bash
# Test ngrok tunnel
nc -z 0.tcp.eu.ngrok.io 15515

# Test direct SSH
nc -z 100.81.165.23 22

# Ping server
ping 100.81.165.23
```

## 📱 Mobile Access
The ngrok tunnel works from mobile SSH apps too:
- **Host**: 0.tcp.eu.ngrok.io
- **Port**: 15515
- **User**: root

## 🔐 Security Notes
- Server has SSH access enabled
- Firewall is configured for necessary ports
- ngrok provides encrypted tunnel
- Consider setting up SSH key authentication for enhanced security

## 🌐 Web Services Access
When connected to server, access web interfaces:
- **Gym Lockers Dashboard**: http://localhost:3001
- **ngrok Web Interface**: http://localhost:4040

## 📞 Support Information
- **Server Memory**: Access via saved credentials
- **Configuration**: Stored in /root/ on server
- **Backup Access**: Multiple methods configured

---
**Last Updated**: August 31, 2025
**Status**: Active and accessible via ngrok tunnel
