#!/bin/bash

# Function to wait for MariaDB to be ready
wait_for_mariadb() {
    local retries=30
    local wait_time=2
    
    echo "Waiting for MariaDB to be ready..."
    for i in $(seq 1 $retries); do
        if mysqladmin ping -h 127.0.0.1 -u root --silent; then
            echo "✅ MariaDB is ready"
            return 0
        fi
        echo "Waiting for MariaDB to be ready... ($i/$retries)"
        sleep $wait_time
    done
    
    echo "❌ Timeout waiting for MariaDB"
    return 1
}

# Function to initialize database
init_database() {
    echo "Initializing database..."
    mysql -h 127.0.0.1 -u root << EOF
CREATE DATABASE IF NOT EXISTS gym_lockers;
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
CREATE USER IF NOT EXISTS 'gym_admin'@'127.0.0.1' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'localhost';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'127.0.0.1';
FLUSH PRIVILEGES;
EOF
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize database"
        return 1
    fi
    echo "✅ Database initialized"
    return 0
}

# Function to test database connection
test_connection() {
    echo "Testing database connection..."
    if mysql -h 127.0.0.1 -u gym_admin -psecure_password_123 gym_lockers -e "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
        return 0
    else
        echo "❌ Database connection failed"
        return 1
    fi
}

# Main execution
echo "Starting database initialization..."

# Wait for MariaDB
if ! wait_for_mariadb; then
    echo "❌ MariaDB not available"
    exit 1
fi

# Initialize database
if ! init_database; then
    echo "❌ Database initialization failed"
    exit 1
fi

# Test connection
if ! test_connection; then
    echo "❌ Database connection test failed"
    exit 1
fi

echo "✅ Database setup completed successfully"
exit 0