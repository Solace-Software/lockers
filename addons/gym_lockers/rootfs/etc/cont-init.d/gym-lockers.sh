#!/usr/bin/with-contenv bashio
# ==============================================================================
# Initial setup for Gym Lockers
# ==============================================================================

# Create required directories
mkdir -p \
    /data/gym-lockers/database \
    /data/gym-lockers/mqtt \
    /data/gym-lockers/logs

# Set permissions
chown -R abc:abc \
    /data/gym-lockers

# If using internal database, set up MariaDB data directory
if ! bashio::config.has_value 'database.host'; then
    bashio::log.info "Setting up internal MariaDB database..."
    
    # Initialize MariaDB data directory if needed
    if [ ! -d "/data/gym-lockers/database/mysql" ]; then
        mysql_install_db --datadir=/data/gym-lockers/database --user=abc
        
        # Start MariaDB temporarily to create database and user
        mysqld_safe --datadir=/data/gym-lockers/database --user=abc --skip-networking=0 --bind-address=127.0.0.1 &
        MYSQL_PID=$!
        
        # Wait for MariaDB to be ready
        while ! mysqladmin ping -h localhost --silent; do
            sleep 1
        done
        
        # Create database and user
        mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS gym_lockers;
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        # Stop temporary MariaDB instance
        kill $MYSQL_PID
        wait $MYSQL_PID
    fi
fi

# If using internal MQTT, configure Mosquitto
if bashio::config.true 'mqtt.use_internal'; then
    bashio::log.info "Setting up internal MQTT broker..."
    
    # Create Mosquitto configuration
    cat > /data/gym-lockers/mqtt/mosquitto.conf << EOF
listener 1883
protocol mqtt

listener 9001
protocol websockets

persistence true
persistence_location /data/gym-lockers/mqtt/

log_dest stderr
log_type all

allow_anonymous true
EOF
fi

# Make scripts executable
chmod a+x /etc/services.d/gym-lockers/run
chmod a+x /etc/services.d/gym-lockers/finish

bashio::log.info "Gym Lockers initialization completed"