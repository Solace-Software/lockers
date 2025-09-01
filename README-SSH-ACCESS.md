# INZAN Gym Lockers - SSH Access

## 🚀 Quick SSH Access

### One-Command Connection:
```bash
./connect-inzan.sh
```

### Direct SSH Command:
```bash
ssh root@4.tcp.eu.ngrok.io -p 13583
```

### Alternative User:
```bash
ssh rubik@4.tcp.eu.ngrok.io -p 13583
```

## 📁 SSH Connection Files

1. **`connect-inzan.sh`** - Executable script for instant connection
2. **`INZAN-SSH-CONNECTION.txt`** - Connection details reference
3. **`INZAN-SSH-ACCESS.sh`** - Full connection menu with options
4. **`INZAN-SERVER-INFO.md`** - Complete server documentation

## 🔧 Connection Options

### Main Access Script:
```bash
./INZAN-SSH-ACCESS.sh
```
Provides menu with:
- ngrok tunnel connection
- Direct IP access
- Server management
- Connection status check
- Troubleshooting

## 📋 Server Information

- **Server Name**: INZAN Gym Lockers
- **Server IP**: 100.81.165.23
- **ngrok Host**: 4.tcp.eu.ngrok.io
- **ngrok Port**: 13583
- **Active Services**: Docker containers, MariaDB, MQTT, nginx

## 🆘 If Connection Fails

1. Check if ngrok tunnel is still running on server
2. Use alternative connection methods in `INZAN-SSH-ACCESS.sh`
3. Restart ngrok tunnel on server if needed

## 📱 Mobile Access

These credentials work with mobile SSH clients:
- **Host**: 4.tcp.eu.ngrok.io
- **Port**: 13583
- **User**: root or rubik

---
**Status**: Active and Working ✅  
**Last Updated**: August 31, 2025
