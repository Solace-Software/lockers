#!/bin/bash

# Function to log messages with timestamps
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if netstat -tln | grep -q ":${port} "; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local retries=30
    local wait_time=2

    log "Waiting for ${service} on port ${port}..."
    for i in $(seq 1 $retries); do
        if check_port "$port"; then
            log "✅ ${service} is ready on port ${port}"
            return 0
        fi
        log "Waiting for ${service} (attempt $i/$retries)..."
        sleep $wait_time
    done

    log "❌ Timeout waiting for ${service} on port ${port}"
    return 1
}

# Function to start MariaDB
start_mariadb() {
    log "Starting MariaDB..."
    
    # Initialize MariaDB data directory if needed
    if [ ! -f /var/lib/mysql/ibdata1 ]; then
        log "Initializing MariaDB data directory..."
        mysql_install_db --datadir=/var/lib/mysql --user=mysql
        if [ $? -ne 0 ]; then
            log "❌ Failed to initialize MariaDB data directory"
            return 1
        fi
    fi

    # Start MariaDB
    /usr/bin/mysqld_safe --datadir=/var/lib/mysql --user=mysql --skip-networking=0 --bind-address=0.0.0.0 &
    MARIADB_PID=$!
    
    # Wait for MariaDB to be ready
    if ! wait_for_port 3306 "MariaDB"; then
        return 1
    fi

    # Initialize database and user
    log "Initializing database..."
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS gym_lockers;
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
CREATE USER IF NOT EXISTS 'gym_admin'@'127.0.0.1' IDENTIFIED BY 'secure_password_123';
CREATE USER IF NOT EXISTS 'gym_admin'@'%' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'localhost';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'127.0.0.1';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'%';
FLUSH PRIVILEGES;
EOF

    if [ $? -ne 0 ]; then
        log "❌ Failed to initialize database"
        return 1
    fi

    # Test connection
    if ! mysql -u gym_admin -psecure_password_123 gym_lockers -e "SELECT 1;" > /dev/null 2>&1; then
        log "❌ Failed to connect to database"
        return 1
    fi

    log "✅ MariaDB setup completed successfully"
    return 0
}

# Function to start MQTT if enabled
start_mqtt() {
    if [ "$MQTT_ENABLED" = "true" ] && [ "$USE_EXTERNAL_MQTT" != "true" ]; then
        log "Starting Mosquitto MQTT broker..."
        /usr/sbin/mosquitto -c /mosquitto/config/mosquitto.conf &
        MQTT_PID=$!
        
        if ! wait_for_port 1883 "MQTT"; then
            return 1
        fi
    else
        log "MQTT is disabled or using external broker"
    fi
    return 0
}

# Function to start the Node.js application
start_app() {
    log "Starting Node.js application..."
    cd /app
    exec node server.js
}

# Main execution
log "Starting Gym Locker Admin Dashboard..."

# Start MariaDB
if ! start_mariadb; then
    log "❌ Failed to start MariaDB"
    exit 1
fi

# Start MQTT
if ! start_mqtt; then
    log "❌ Failed to start MQTT"
    exit 1
fi

# Start the application
start_app