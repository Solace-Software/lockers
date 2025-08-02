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
    USE_EXTERNAL_MQTT=$(bashio::jq "${CONFIG}" '.use_external_mqtt // false')
    EXTERNAL_MQTT_HOST=$(bashio::jq "${CONFIG}" '.external_mqtt_host // ""')
    EXTERNAL_MQTT_PORT=$(bashio::jq "${CONFIG}" '.external_mqtt_port // 1883')
    EXTERNAL_MQTT_USERNAME=$(bashio::jq "${CONFIG}" '.external_mqtt_username // ""')
    EXTERNAL_MQTT_PASSWORD=$(bashio::jq "${CONFIG}" '.external_mqtt_password // ""')
    EXTERNAL_MQTT_CLIENT_ID=$(bashio::jq "${CONFIG}" '.external_mqtt_client_id // "gym-admin-external"')
    SYSTEM_AUTO_REFRESH=$(bashio::jq "${CONFIG}" '.system_auto_refresh // 30')
    SYSTEM_DEBUG_MODE=$(bashio::jq "${CONFIG}" '.system_debug_mode // false')
else
    bashio::log.warning "No configuration file found, using defaults"
    USE_EXTERNAL_MQTT=false
    EXTERNAL_MQTT_HOST=""
    EXTERNAL_MQTT_PORT=1883
    EXTERNAL_MQTT_USERNAME=""
    EXTERNAL_MQTT_PASSWORD=""
    EXTERNAL_MQTT_CLIENT_ID="gym-admin-external"
    SYSTEM_AUTO_REFRESH=30
    SYSTEM_DEBUG_MODE=false
fi

# Create necessary directories
mkdir -p /var/lib/mysql /var/log/mysql /var/run/mysqld
mkdir -p /mosquitto/data /mosquitto/log /mosquitto/config
mkdir -p /app/logs /app/data

# Generate supervisor configuration based on external MQTT setting
bashio::log.info "Generating supervisor configuration..."
cat > /etc/supervisor/conf.d/supervisord.conf << EOF
[supervisord]
nodaemon=true
user=root
logfile=/app/logs/supervisord.log
pidfile=/app/supervisord.pid

[program:mariadb]
command=/usr/bin/mysqld_safe --datadir=/var/lib/mysql
user=mysql
autostart=true
autorestart=true
startretries=3
stdout_logfile=/app/logs/mariadb.log
stderr_logfile=/app/logs/mariadb.error.log
priority=100
environment=HOME="/var/lib/mysql"

EOF

# Add MQTT configuration only if not using external MQTT
if [ "$USE_EXTERNAL_MQTT" != "true" ]; then
    cat >> /etc/supervisor/conf.d/supervisord.conf << EOF
[program:mosquitto]
command=/usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf
user=mosquitto
autostart=true
autorestart=true
startretries=3
stdout_logfile=/app/logs/mosquitto.log
stderr_logfile=/app/logs/mosquitto.error.log
priority=200
startsecs=5

EOF
fi

# Add application configuration
cat >> /etc/supervisor/conf.d/supervisord.conf << EOF
[program:gym-locker-app]
command=/usr/bin/node /app/server.js
user=root
directory=/app
autostart=true
autorestart=true
startretries=3
stdout_logfile=/app/logs/app.log
stderr_logfile=/app/logs/app.error.log
priority=300
environment=DB_HOST=localhost,DB_PORT=3306,DB_USER=gym_admin,DB_PASSWORD=secure_password_123,DB_NAME=gym_lockers,MQTT_HOST=localhost,MQTT_PORT=1884,MQTT_USERNAME=gym_mqtt_user,MQTT_PASSWORD=mqtt_password_123,MQTT_CLIENT_ID=gym-admin-ha-addon

[eventlistener:processes]
command=bash -c "while true; do sleep 30; done"
events=PROCESS_STATE_STOPPED,PROCESS_STATE_EXITED,PROCESS_STATE_FATAL
EOF

# Initialize database if it doesn't exist
if [ ! -f /var/lib/mysql/mysql ]; then
    bashio::log.info "Initializing database..."
    mysql_install_db --datadir=/var/lib/mysql --user=mysql
fi

# Update database password if provided
if [ "$DB_PASSWORD" != "secure_password_123" ]; then
    bashio::log.info "Updating database password..."
    # Wait for MySQL to be ready
    sleep 5
    mysql -u root -e "ALTER USER 'gym_admin'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null || true
    mysql -u root -e "FLUSH PRIVILEGES;" 2>/dev/null || true
fi

# Update MQTT password if provided
if [ "$MQTT_PASSWORD" != "mqtt_password_123" ]; then
    bashio::log.info "Updating MQTT password..."
    mosquitto_passwd -b /mosquitto/config/passwd "$MQTT_USERNAME" "$MQTT_PASSWORD" 2>/dev/null || true
fi

# Set environment variables for the application
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=gym_admin
export DB_PASSWORD="secure_password_123"
export DB_NAME=gym_lockers

# Set MQTT configuration based on external MQTT setting
if [ "$USE_EXTERNAL_MQTT" = "true" ] && [ -n "$EXTERNAL_MQTT_HOST" ]; then
    bashio::log.info "Using external MQTT broker: $EXTERNAL_MQTT_HOST:$EXTERNAL_MQTT_PORT"
    export MQTT_HOST="$EXTERNAL_MQTT_HOST"
    export MQTT_PORT="$EXTERNAL_MQTT_PORT"
    export MQTT_USERNAME="$EXTERNAL_MQTT_USERNAME"
    export MQTT_PASSWORD="$EXTERNAL_MQTT_PASSWORD"
    export MQTT_CLIENT_ID="$EXTERNAL_MQTT_CLIENT_ID"
    export USE_EXTERNAL_MQTT=true
else
    bashio::log.info "Using built-in MQTT broker"
    export MQTT_HOST=localhost
    export MQTT_PORT=1884
    export MQTT_USERNAME="gym_mqtt_user"
    export MQTT_PASSWORD="mqtt_password_123"
    export MQTT_CLIENT_ID="gym-admin-ha-addon"
    export USE_EXTERNAL_MQTT=false
fi

export SYSTEM_AUTO_REFRESH="$SYSTEM_AUTO_REFRESH"
export SYSTEM_DEBUG_MODE="$SYSTEM_DEBUG_MODE"

# Start supervisor to manage all services
bashio::log.info "Starting supervisor..."

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 