#!/usr/bin/with-contenv bashio
set -e

# Function to check if configuration is valid
check_config() {
    bashio::log.info "Validating configuration..."
    
    # Check database configuration
    if ! bashio::config.exists 'database.host'; then
        bashio::log.error "Database host not configured"
        return 1
    fi
    
    if ! bashio::config.exists 'database.username'; then
        bashio::log.error "Database username not configured"
        return 1
    fi
    
    if ! bashio::config.exists 'database.password'; then
        bashio::log.error "Database password not configured"
        return 1
    fi

    # Check MQTT configuration
    if ! bashio::config.true 'mqtt.use_internal'; then
        # External MQTT - validate required fields
        if ! bashio::config.exists 'mqtt.external_host'; then
            bashio::log.error "External MQTT host not configured"
            return 1
        fi
    fi

    return 0
}

# Function to setup MQTT configuration
setup_mqtt() {
    if bashio::config.true 'mqtt.use_internal'; then
        bashio::log.info "Using internal MQTT broker"
        export MQTT_HOST="localhost"
        export MQTT_PORT="1883"
        export MQTT_USERNAME=""
        export MQTT_PASSWORD=""
        
        # Start internal MQTT broker
        bashio::log.info "Starting internal MQTT broker..."
        mosquitto -c /etc/mosquitto/mosquitto.conf &
    else
        bashio::log.info "Using external MQTT broker"
        export MQTT_HOST=$(bashio::config 'mqtt.external_host')
        export MQTT_PORT=$(bashio::config 'mqtt.external_port')
        export MQTT_USERNAME=$(bashio::config 'mqtt.external_username')
        export MQTT_PASSWORD=$(bashio::config 'mqtt.external_password')
    fi
}

# Main startup sequence
main() {
    bashio::log.info "Starting Gym Lockers Management System..."

    # Check configuration
    if ! check_config; then
        bashio::log.error "Invalid configuration - please check your addon configuration"
        bashio::log.error "The addon will not start until the configuration is valid"
        exit 1
    fi

    # Export database configuration
    export DB_HOST=$(bashio::config 'database.host')
    export DB_PORT=$(bashio::config 'database.port')
    export DB_NAME=$(bashio::config 'database.name')
    export DB_USER=$(bashio::config 'database.username')
    export DB_PASSWORD=$(bashio::config 'database.password')

    # Setup MQTT based on configuration
    setup_mqtt

    # Export system settings
    export SYSTEM_AUTO_REFRESH=$(bashio::config 'system.auto_refresh')
    export SYSTEM_DATA_RETENTION=$(bashio::config 'system.data_retention_days')
    export SYSTEM_DEBUG_MODE=$(bashio::config 'system.debug_mode')

    bashio::log.info "Configuration validated - starting services..."

    # Start the application
    cd /app
    exec node server.js
}

# Run main function
main "$@"