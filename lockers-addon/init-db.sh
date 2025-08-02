#!/bin/bash

# Wait for MariaDB to be ready
for i in {1..30}; do
    if mysqladmin ping -h localhost -u root --silent; then
        break
    fi
    echo "Waiting for MariaDB to be ready... ($i/30)"
    sleep 1
done

# Initialize database and user
mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS gym_lockers;
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;
EOF

# Test the connection
if mysql -u gym_admin -psecure_password_123 -h localhost -e "SELECT 1;" gym_lockers >/dev/null 2>&1; then
    echo "✅ Database initialized and connection successful"
    exit 0
else
    echo "❌ Database initialization failed"
    exit 1
fi