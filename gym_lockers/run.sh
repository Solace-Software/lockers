#!/usr/bin/with-contenv bashio
set -e

# Function to check if configuration is valid
check_config() {
    bashio::log.info "Validating configuration..."
    
    # Check database configuration
    if ! bashio::config.has_value 'database.host'; then
        bashio::log.error "Database host not configured"
        return 1
    fi
    
    if ! bashio::config.has_value 'database.username'; then
        bashio::log.error "Database username not configured"
        return 1
    fi
    
    if ! bashio::config.has_value 'database.password'; then
        bashio::log.error "Database password not configured"
        return 1
    fi

    # Check MQTT configuration
    if ! bashio::config.true 'mqtt.use_internal'; then
        # External MQTT - validate required fields
        if ! bashio::config.has_value 'mqtt.external.host'; then
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
        export MQTT_ENABLED="true"
        export MQTT_HOST="localhost"
        export MQTT_PORT="1883"
        export MQTT_USERNAME=""
        export MQTT_PASSWORD=""
        
        # Start internal MQTT broker
        bashio::log.info "Starting internal MQTT broker..."
        mosquitto -c /mosquitto/config/mosquitto.conf &
    else
        bashio::log.info "Using external MQTT broker"
        export MQTT_ENABLED="true"
        export MQTT_HOST=$(bashio::config 'mqtt.external.host')
        export MQTT_PORT=$(bashio::config 'mqtt.external.port')
        export MQTT_USERNAME=$(bashio::config 'mqtt.external.username')
        export MQTT_PASSWORD=$(bashio::config 'mqtt.external.password')
    fi
}

# Main startup sequence
main() {
    bashio::log.info "Starting Gym Lockers Management System..."

    # Check configuration
    if ! check_config; then
        bashio::exit.nok "Invalid configuration"
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
    export SYSTEM_DATA_RETENTION=$(bashio::config 'system.data_retention')
    export SYSTEM_DEBUG_MODE=$(bashio::config 'system.debug_mode')

    bashio::log.info "Configuration validated - starting services..."

    # Start supervisord to manage services
    bashio::log.info "Starting supervisord..."
    exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
}

# Run main function
main "$@"