#!/bin/bash

# Local Development Deployment Script
echo "🚀 Starting Gym Lockers Local Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Load development environment variables
if [ -f "env.development" ]; then
    echo "📋 Loading development environment variables..."
    export $(cat env.development | grep -v '^#' | xargs)
else
    echo "⚠️  No env.development file found. Using defaults."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p db-data db-init mqtt-data mqtt-logs

# Build and start services
echo "🔨 Building and starting services..."
docker-compose --profile dev up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

echo ""
echo "✅ Local development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  Database: localhost:3306"
echo "📡 MQTT Broker: localhost:1883"
echo "🌐 MQTT WebSocket: localhost:9001"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f [service]"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart [service]"
echo "  Shell access: docker-compose exec [service] sh"
