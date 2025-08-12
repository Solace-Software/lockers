#!/usr/bin/with-contenv bashio

# Get options from Home Assistant
DATABASE_URL=$(bashio::config 'database_url')
MQTT_HOST=$(bashio::config 'mqtt_host')
MQTT_PORT=$(bashio::config 'mqtt_port')
MQTT_USERNAME=$(bashio::config 'mqtt_username')
MQTT_PASSWORD=$(bashio::config 'mqtt_password')
USE_INTERNAL_MQTT=$(bashio::config 'use_internal_mqtt')
LOG_LEVEL=$(bashio::config 'log_level')

# Set environment variables
export DATABASE_URL="${DATABASE_URL:-sqlite:///data/lockers.db}"
export MQTT_HOST="${MQTT_HOST:-localhost}"
export MQTT_PORT="${MQTT_PORT:-1883}"
export MQTT_USERNAME="${MQTT_USERNAME}"
export MQTT_PASSWORD="${MQTT_PASSWORD}"
export USE_INTERNAL_MQTT="${USE_INTERNAL_MQTT:-true}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export NODE_ENV="production"

# Use Home Assistant's MQTT broker if internal MQTT is enabled
if bashio::config.true 'use_internal_mqtt'; then
    if bashio::services.available "mqtt"; then
        export MQTT_HOST=$(bashio::services "mqtt" "host")
        export MQTT_PORT=$(bashio::services "mqtt" "port")
        export MQTT_USERNAME=$(bashio::services "mqtt" "username")
        export MQTT_PASSWORD=$(bashio::services "mqtt" "password")
        bashio::log.info "Using Home Assistant MQTT broker"
    else
        bashio::log.warning "Home Assistant MQTT service not available, using configured settings"
    fi
fi

# Ensure data directory exists
mkdir -p /data

# Change to app directory
cd /app

# Start the application
bashio::log.info "Starting Gym Locker Management System..."
bashio::log.info "Web interface will be available on port 3001"

exec node server.js