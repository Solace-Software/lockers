-- Gym Lockers Database Initialization
-- This script runs when the MariaDB container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gym_lockers CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE gym_lockers;

-- Create admin user with proper permissions
CREATE USER IF NOT EXISTS 'gym_admin'@'%' IDENTIFIED BY 'gym_password';
GRANT ALL PRIVILEGES ON gym_lockers.* TO 'gym_admin'@'%';
FLUSH PRIVILEGES;

-- Create root user for management (if needed)
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Show created users
SELECT User, Host FROM mysql.user WHERE User IN ('gym_admin', 'root');
