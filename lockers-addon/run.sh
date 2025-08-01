#!/usr/bin/env bashio

# ==============================================================================
# Home Assistant Add-on: Gym Locker Admin Dashboard All-in-One
# ==============================================================================

bashio::log.info "Starting Gym Locker Admin Dashboard All-in-One..."

# Load configuration
CONFIG_PATH=/data/options.json
if bashio::fs.file_exists "${CONFIG_PATH}"; then
    bashio::log.info "Loading configuration from ${CONFIG_PATH}"
    CONFIG=$(cat "${CONFIG_PATH}")
    
    # Extract configuration values
    DB_PASSWORD=$(bashio::jq "${CONFIG}" '.db_password // "secure_password_123"')
    MQTT_USERNAME=$(bashio::jq "${CONFIG}" '.mqtt_username // "gym_mqtt_user"')
    MQTT_PASSWORD=$(bashio::jq "${CONFIG}" '.mqtt_password // "mqtt_password_123"')
    MQTT_CLIENT_ID=$(bashio::jq "${CONFIG}" '.mqtt_client_id // "gym-admin-ha-addon"')
    SYSTEM_AUTO_REFRESH=$(bashio::jq "${CONFIG}" '.system_auto_refresh // 30')
    SYSTEM_DATA_RETENTION_DAYS=$(bashio::jq "${CONFIG}" '.system_data_retention_days // 90')
    SYSTEM_BACKUP_ENABLED=$(bashio::jq "${CONFIG}" '.system_backup_enabled // true')
    SYSTEM_DEBUG_MODE=$(bashio::jq "${CONFIG}" '.system_debug_mode // false')
    SECURITY_SESSION_TIMEOUT=$(bashio::jq "${CONFIG}" '.security_session_timeout // 30')
    SECURITY_PASSWORD_POLICY=$(bashio::jq "${CONFIG}" '.security_password_policy // "standard"')
    SECURITY_TWO_FACTOR_AUTH=$(bashio::jq "${CONFIG}" '.security_two_factor_auth // false')
    SECURITY_AUDIT_LOGGING=$(bashio::jq "${CONFIG}" '.security_audit_logging // true')
else
    bashio::log.warning "No configuration file found, using defaults"
    DB_PASSWORD="secure_password_123"
    MQTT_USERNAME="gym_mqtt_user"
    MQTT_PASSWORD="mqtt_password_123"
    MQTT_CLIENT_ID="gym-admin-ha-addon"
    SYSTEM_AUTO_REFRESH=30
    SYSTEM_DATA_RETENTION_DAYS=90
    SYSTEM_BACKUP_ENABLED=true
    SYSTEM_DEBUG_MODE=false
    SECURITY_SESSION_TIMEOUT=30
    SECURITY_PASSWORD_POLICY="standard"
    SECURITY_TWO_FACTOR_AUTH=false
    SECURITY_AUDIT_LOGGING=true
fi

# Create necessary directories
mkdir -p /data/db /data/mqtt /data/app /app/logs

# Initialize database if it doesn't exist
if [ ! -f /data/db/mysql ]; then
    bashio::log.info "Initializing database..."
    mysql_install_db --datadir=/data/db --user=mysql
fi

# Update database password if provided
if [ "$DB_PASSWORD" != "secure_password_123" ]; then
    bashio::log.info "Updating database password..."
    mysql -u root -e "ALTER USER 'gym_admin'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    mysql -u root -e "FLUSH PRIVILEGES;"
fi

# Update MQTT password if provided
if [ "$MQTT_PASSWORD" != "mqtt_password_123" ]; then
    bashio::log.info "Updating MQTT password..."
    mosquitto_passwd -b /mosquitto/config/passwd "$MQTT_USERNAME" "$MQTT_PASSWORD"
fi

# Set environment variables for the application
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=gym_admin
export DB_PASSWORD="$DB_PASSWORD"
export DB_NAME=gym_lockers

export MQTT_HOST=localhost
export MQTT_PORT=1883
export MQTT_USERNAME="$MQTT_USERNAME"
export MQTT_PASSWORD="$MQTT_PASSWORD"
export MQTT_CLIENT_ID="$MQTT_CLIENT_ID"

export SYSTEM_AUTO_REFRESH="$SYSTEM_AUTO_REFRESH"
export SYSTEM_DATA_RETENTION_DAYS="$SYSTEM_DATA_RETENTION_DAYS"
export SYSTEM_BACKUP_ENABLED="$SYSTEM_BACKUP_ENABLED"
export SYSTEM_DEBUG_MODE="$SYSTEM_DEBUG_MODE"

export SECURITY_SESSION_TIMEOUT="$SECURITY_SESSION_TIMEOUT"
export SECURITY_PASSWORD_POLICY="$SECURITY_PASSWORD_POLICY"
export SECURITY_TWO_FACTOR_AUTH="$SECURITY_TWO_FACTOR_AUTH"
export SECURITY_AUDIT_LOGGING="$SECURITY_AUDIT_LOGGING"

# Start supervisor to manage all services
bashio::log.info "Starting supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 