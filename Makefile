# Gym Lockers Management System - Makefile
# Provides convenient shortcuts for common Docker Compose operations

.PHONY: help dev prod down logs clean build restart status shell

# Default target
help:
	@echo "Gym Lockers Management System - Available Commands:"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment (frontend + backend + db + mqtt)"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment (backend + db + mqtt + nginx)"
	@echo "  make prod-build   - Build and start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "Management Commands:"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make status       - Show service status"
	@echo "  make logs         - View all service logs"
	@echo "  make clean        - Remove all containers, networks, and volumes"
	@echo "  make build        - Build all service images"
	@echo ""
	@echo "Service Access:"
	@echo "  make shell-backend    - Access backend service shell"
	@echo "  make shell-db         - Access database service shell"
	@echo "  make shell-mqtt       - Access MQTT service shell"
	@echo "  make shell-frontend   - Access frontend service shell (dev only)"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-backup        - Create database backup"
	@echo "  make db-restore       - Restore database from backup"
	@echo ""
	@echo "MQTT Commands:"
	@echo "  make mqtt-test        - Test MQTT connectivity"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make health           - Check all service health"
	@echo "  make update           - Pull latest images and restart"

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	docker-compose --profile dev up -d

dev-build:
	@echo "🔨 Building and starting development environment..."
	docker-compose --profile dev up --build -d

dev-logs:
	@echo "📋 Development environment logs:"
	docker-compose --profile dev logs -f

# Production environment
prod:
	@echo "🚀 Starting production environment..."
	docker-compose --profile prod up -d

prod-build:
	@echo "🔨 Building and starting production environment..."
	docker-compose --profile prod up --build -d

prod-logs:
	@echo "📋 Production environment logs:"
	docker-compose --profile prod logs -f

# Management commands
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

restart:
	@echo "🔄 Restarting all services..."
	docker-compose restart

status:
	@echo "📊 Service status:"
	docker-compose ps

logs:
	@echo "📋 All service logs:"
	docker-compose logs -f

clean:
	@echo "🧹 Cleaning up all containers, networks, and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

build:
	@echo "🔨 Building all service images..."
	docker-compose build

# Service shell access
shell-backend:
	@echo "🐚 Accessing backend service shell..."
	docker-compose exec backend sh

shell-db:
	@echo "🐚 Accessing database service shell..."
	docker-compose exec db bash

shell-mqtt:
	@echo "🐚 Accessing MQTT service shell..."
	docker-compose exec mqtt sh

shell-frontend:
	@echo "🐚 Accessing frontend service shell..."
	docker-compose exec frontend sh

# Database commands
db-backup:
	@echo "💾 Creating database backup..."
	docker-compose exec db mysqldump -u root -p$(shell grep DB_ROOT_PASSWORD env.development | cut -d'=' -f2) gym_lockers > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore:
	@echo "📥 Restoring database from backup..."
	@read -p "Enter backup filename: " backup_file; \
	docker-compose exec -T db mysql -u root -p$(shell grep DB_ROOT_PASSWORD env.development | cut -d'=' -f2) gym_lockers < $$backup_file

# MQTT commands
mqtt-test:
	@echo "📡 Testing MQTT connectivity..."
	docker-compose exec mqtt mosquitto_pub -h localhost -t test/topic -m "test message"

# Utility commands
health:
	@echo "🏥 Checking service health..."
	docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Health check endpoints:"
	@echo "  Backend: http://localhost:3001/api/heartbeat"
	@echo "  Database: docker-compose exec db mysqladmin ping -h localhost"
	@echo "  MQTT: docker-compose exec mqtt mosquitto_pub -h localhost -t test -m test"

update:
	@echo "🔄 Updating services..."
	docker-compose pull
	docker-compose up -d

# Environment setup
setup-dev:
	@echo "⚙️  Setting up development environment..."
	@if [ ! -f .env ]; then \
		cp env.development .env; \
		echo "Created .env from env.development"; \
	else \
		echo ".env already exists"; \
	fi
	mkdir -p db-data db-init mqtt-data mqtt-logs

setup-prod:
	@echo "⚙️  Setting up production environment..."
	@if [ ! -f .env ]; then \
		cp env.production .env; \
		echo "Created .env from env.production"; \
	else \
		echo ".env already exists"; \
	fi
	mkdir -p db-data db-init mqtt-data mqtt-logs nginx/ssl

# Quick start for local development
quick-start: setup-dev dev
	@echo ""
	@echo "✅ Quick start completed!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:3001"
	@echo "🗄️  Database: localhost:3306"
	@echo "📡 MQTT: localhost:1883"
