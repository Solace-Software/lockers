# Gym Locker Dashboard - Server Startup Guide

## Robust Startup Solution

This guide provides a comprehensive solution for starting the Gym Locker Dashboard server with automatic port cleanup and conflict resolution.

## Available Commands

### Primary Commands
- `npm run server` - **Recommended**: Starts server with automatic port cleanup
- `npm start` - Standard start command
- `npm run dev` - Development mode (both server and client)

### Utility Commands
- `npm run cleanup` - Manually clean up port conflicts
- `npm run build` - Build the React client

## Command Details

### `npm run server` (Recommended)
```bash
npm run server
```
**What it does:**
- Automatically detects and kills processes on port 3001
- Starts the backend server on the cleared port
- Provides detailed logging of the cleanup process
- Ensures clean startup every time

**Output example:**
```
Starting Gym Locker Admin Dashboard...

Checking for processes on port 3001...
Port 3001 is free

Starting backend server...
Server is running on port 3001
```

### `npm start`
```bash
npm start
```
**What it does:**
- Standard start command
- May fail if port 3001 is already in use
- Requires manual port cleanup if conflicts occur

### `npm run dev`
```bash
npm run dev
```
**What it does:**
- Starts both backend server and React client
- Backend on port 3001, React dev server on port 3000
- Useful for development with hot reloading

## How It Works

The `npm run server` command uses a custom startup script (`start-server.js`) that:

1. **Port Detection**: Checks if port 3001 is already in use
2. **Process Identification**: Finds all processes using the port
3. **Automatic Cleanup**: Kills conflicting processes
4. **Server Startup**: Starts the backend server on the cleared port
5. **Logging**: Provides detailed feedback throughout the process

## Port Usage

- **Port 3001**: Backend API server (main application)
- **Port 3000**: React development server (when using `npm run dev`)
- **Port 5000**: Cleanup utility (internal use)

## Troubleshooting

### Port Already in Use Error
If you see "Port 3001 is already in use":

**Solution 1: Use the recommended command**
```bash
npm run server
```
This will automatically clean up the port and start the server.

**Solution 2: Manual cleanup**
```bash
npm run cleanup
npm start
```

**Solution 3: Find and kill the process manually**
```bash
lsof -ti:3001 | xargs kill -9
npm start
```

### Permission Denied Error
If you get permission errors when killing processes:

**Solution: Use sudo (on macOS/Linux)**
```bash
sudo lsof -ti:3001 | xargs sudo kill -9
npm start
```

### React Client Build Issues
If the client build fails:

**Solution: Rebuild the client**
```bash
npm run build
npm run server
```

## Benefits

1. **Automatic Conflict Resolution**: No more manual port cleanup
2. **Reliable Startup**: Consistent server startup every time
3. **Detailed Logging**: Clear feedback on what's happening
4. **Development Friendly**: Works seamlessly with development workflow
5. **Production Ready**: Clean startup process for production deployments

## Port Configuration

The server is configured to use port 3001 by default. To change this:

1. **Environment Variable**: Set `PORT=3002` before starting
2. **Configuration File**: Modify `gym_lockers/config.js`
3. **Command Line**: `PORT=3002 npm run server`

## Quick Start

1. **Navigate to the project directory**
   ```bash
   cd gym_lockers
   ```

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run server
   ```

4. **Access the dashboard**
   - Open your browser to `http://localhost:3001`
   - The server will be running and ready to use

## Development Workflow

For active development:

1. **Start development mode**
   ```bash
   npm run dev
   ```

2. **Make changes to your code**
   - Backend changes: Server will restart automatically
   - Frontend changes: React will hot reload

3. **Stop development mode**
   - Press `Ctrl+C` in the terminal

4. **Start production mode**
   ```bash
   npm run server
   ```

This setup provides a robust, developer-friendly way to start and manage the Gym Locker Dashboard server. 