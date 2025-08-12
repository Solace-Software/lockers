#!/bin/sh
set -e

log() {
  echo "[init-db] $(date '+%Y-%m-%d %H:%M:%S') $1"
}

DATA_DIR="/var/lib/mysql"
RUN_AS="mysql"

# Ensure directories exist
mkdir -p "$DATA_DIR" /var/log/mysql
chown -R $RUN_AS:$RUN_AS "$DATA_DIR"

# Initialize data directory if missing
if [ ! -d "$DATA_DIR/mysql" ]; then
  log "Initializing MariaDB data directory..."
  if command -v mysql_install_db >/dev/null 2>&1; then
    mysql_install_db --datadir="$DATA_DIR" --user="$RUN_AS"
  else
    mariadb-install-db --datadir="$DATA_DIR" --user="$RUN_AS"
  fi
fi

# Start temporary mysqld
log "Starting temporary mysqld..."
/usr/bin/mysqld_safe --datadir="$DATA_DIR" --user="$RUN_AS" --skip-networking=0 --bind-address=127.0.0.1 &
MYSQLD_PID=$!

# Wait until ready
TRIES=60
until mysqladmin ping -h 127.0.0.1 --silent >/dev/null 2>&1; do
  TRIES=$((TRIES-1))
  if [ "$TRIES" -le 0 ]; then
    log "Timeout waiting for mysqld"
    exit 1
  fi
  sleep 1
done
log "mysqld is ready"

# Create database and user
log "Creating database and user if not exists..."
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS gym_lockers;
CREATE USER IF NOT EXISTS 'gym_admin'@'localhost' IDENTIFIED BY 'secure_password_123';
CREATE USER IF NOT EXISTS 'gym_admin'@'127.0.0.1' IDENTIFIED BY 'secure_password_123';
CREATE USER IF NOT EXISTS 'gym_admin'@'%' IDENTIFIED BY 'secure_password_123';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'localhost';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'127.0.0.1';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'%';
FLUSH PRIVILEGES;
SQL

# Shutdown temporary mysqld
log "Stopping temporary mysqld..."
mysqladmin -u root shutdown || kill "$MYSQLD_PID" || true
wait "$MYSQLD_PID" 2>/dev/null || true
log "Initialization complete"
