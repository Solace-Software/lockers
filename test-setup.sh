#!/bin/bash

# Test script for Gym Lockers Docker setup
echo "🧪 Testing Gym Lockers Docker Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install it first."
    exit 1
fi

# Check if required files exist
required_files=(
    "docker-compose.yml"
    "gym_lockers/Dockerfile.backend"
    "gym_lockers/client/Dockerfile.frontend"
    "mqtt-config/mosquitto.conf"
    "nginx/nginx.conf"
    "db-init/01-init.sql"
)

echo "📋 Checking required files..."
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        exit 1
    fi
done

# Check if environment files exist
if [ -f "env.development" ]; then
    echo "✅ env.development"
else
    echo "⚠️  env.development (missing, will use defaults)"
fi

if [ -f "env.production" ]; then
    echo "✅ env.production"
else
    echo "⚠️  env.production (missing, will use defaults)"
fi

# Test Docker Compose syntax
echo "🔍 Validating Docker Compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    docker-compose config
    exit 1
fi

# Check if ports are available
echo "🔌 Checking port availability..."
ports_to_check=(3000 3001 3306 1883 9001 80 443)

for port in "${ports_to_check[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
    else
        echo "✅ Port $port is available"
    fi
done

# Test image building (without starting)
echo "🔨 Testing image building..."
if docker-compose build --no-cache > /dev/null 2>&1; then
    echo "✅ Images can be built successfully"
else
    echo "❌ Image building failed"
    exit 1
fi

echo ""
echo "🎉 Setup test completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run 'make quick-start' to start development environment"
echo "  2. Or run './deploy-local.sh' for manual deployment"
echo "  3. Check 'make help' for available commands"
echo ""
echo "🔧 Useful commands:"
echo "  make help           - Show all available commands"
echo "  make status         - Check service status"
echo "  make logs           - View service logs"
echo "  make down           - Stop all services"
echo "  make clean          - Clean up everything"
