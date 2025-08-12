#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0 # Port is in use
    else
        return 1 # Port is free
    fi
}

# Function to find next available port
find_next_port() {
    local port=$1
    while check_port $port; do
        echo -e "${YELLOW}Port $port is in use, trying next port...${NC}"
        port=$((port + 1))
    done
    echo $port
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid
    fi
}

# Clean up function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Default ports
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Check if we need to kill existing processes
if [ "$1" == "--force" ]; then
    echo -e "${YELLOW}Force flag detected, killing existing processes...${NC}"
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
fi

# Find available ports
BACKEND_PORT=$(find_next_port $BACKEND_PORT)
FRONTEND_PORT=$(find_next_port $FRONTEND_PORT)

echo -e "${GREEN}Using ports:${NC}"
echo -e "Backend:  ${GREEN}$BACKEND_PORT${NC}"
echo -e "Frontend: ${GREEN}$FRONTEND_PORT${NC}"

# Export ports for child processes
export PORT=$FRONTEND_PORT
export BACKEND_PORT=$BACKEND_PORT

# Start backend server
echo -e "\n${GREEN}Starting backend server...${NC}"
cd "$(dirname "$0")"
node server.js &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend server to start...${NC}"
while ! nc -z localhost $BACKEND_PORT 2>/dev/null; do
    sleep 1
done
echo -e "${GREEN}Backend server started successfully!${NC}"

# Start frontend server
echo -e "\n${GREEN}Starting frontend server...${NC}"
cd client
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend server to start...${NC}"
while ! nc -z localhost $FRONTEND_PORT 2>/dev/null; do
    sleep 1
done
echo -e "${GREEN}Frontend server started successfully!${NC}"

echo -e "\n${GREEN}All services are running:${NC}"
echo -e "Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for child processes
wait