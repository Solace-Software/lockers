# Server Startup System

## 🚀 Robust Startup Solution

This project includes a robust startup system that **prevents port conflicts forever**. The system automatically handles port conflicts and ensures clean server startup every time.

## 📋 Available Commands

### Primary Commands
```bash
# Recommended: Start server with automatic port cleanup
npm run server
npm start

# Alternative: Clean start (same as above)
npm run clean-start
```

### Development Commands
```bash
# Start with nodemon (development mode)
npm run server-dev

# Start server directly (no port cleanup)
npm run server-direct

# Start both server and client
npm run dev
```

### Utility Commands
```bash
# Clean up all ports manually
npm run cleanup

# Install all dependencies
npm run install-all

# Build client for production
npm run build
```

## 🔧 How It Works

### Automatic Port Management
- **Port 3001**: Backend server (hardcoded, never changes)
- **Port 3000**: React development server
- **Port 5000**: Automatically cleaned up (common conflict source)

### Startup Process
1. **Port Cleanup**: Automatically kills any processes on required ports
2. **Clean Start**: Starts server on a guaranteed clean port
3. **Error Handling**: Automatically retries if startup fails
4. **Graceful Shutdown**: Properly handles process termination

### Files
- `start-server.js`: Main startup script with port management
- `cleanup-ports.js`: Emergency port cleanup utility
- `server.js`: Main server application (hardcoded to port 3001)

## 🛠️ Troubleshooting

### If Server Won't Start
```bash
# Manual cleanup
npm run cleanup

# Then start normally
npm run server
```

### If Port Conflicts Persist
```bash
# Nuclear option - kill everything
sudo lsof -ti:3001 | xargs sudo kill -9
sudo lsof -ti:3000 | xargs sudo kill -9
sudo lsof -ti:5000 | xargs sudo kill -9

# Then start
npm run server
```

### Check What's Running
```bash
# See what's using port 3001
lsof -i:3001

# See all Node processes
ps aux | grep node
```

## ✅ Benefits

1. **No More Port Conflicts**: Automatic port cleanup prevents EADDRINUSE errors
2. **Consistent Startup**: Server always starts on port 3001
3. **Error Recovery**: Automatic retry on startup failures
4. **Development Friendly**: Separate commands for different scenarios
5. **Production Ready**: Graceful shutdown and error handling

## 🔒 Port Configuration

The server is **hardcoded to use port 3001** and will **never** try to use port 5000 again. This is enforced in the code:

```javascript
// Ensure we always use port 3001, regardless of environment variables
const PORT = 3001;
```

## 🎯 Quick Start

For most users, just run:
```bash
npm run server
```

The system will handle everything automatically! 