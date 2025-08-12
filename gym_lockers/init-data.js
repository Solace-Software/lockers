#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'gym_admin',
    password: process.env.DB_PASSWORD || 'gym_password',
    database: process.env.DB_NAME || 'gym_lockers'
};

async function initializeData() {
    console.log('Starting data initialization...');
    
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');
        
        // Create admin user
        console.log('1. Creating admin user...');
        const adminPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(`
            INSERT IGNORE INTO users (username, email, password, role, rfid_tag, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, ['admin', 'admin@gym.com', adminPassword, 'admin', 'ADMIN001']);
        
        // Create test group
        console.log('2. Creating test group...');
        await connection.execute(`
            INSERT IGNORE INTO groups (name, description, max_members, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        `, ['General Members', 'Default group for all members', 100]);
        
        // Create test lockers
        console.log('3. Creating test lockers...');
        const lockerData = [
            ['A1', 'Available', 'Small', 'Ground Floor', 'A'],
            ['A2', 'Available', 'Small', 'Ground Floor', 'A'],
            ['A3', 'Available', 'Medium', 'Ground Floor', 'A'],
            ['A4', 'Available', 'Large', 'Ground Floor', 'A'],
            ['B1', 'Available', 'Small', 'First Floor', 'B'],
            ['B2', 'Available', 'Medium', 'First Floor', 'B'],
            ['B3', 'Available', 'Large', 'First Floor', 'B'],
            ['C1', 'Available', 'Small', 'Second Floor', 'C'],
            ['C2', 'Available', 'Medium', 'Second Floor', 'C'],
            ['C3', 'Available', 'Large', 'Second Floor', 'C']
        ];
        
        for (const [number, status, size, location, section] of lockerData) {
            await connection.execute(`
                INSERT IGNORE INTO lockers (number, status, size, location, section, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `, [number, status, size, location, section]);
        }
        
        // Create default settings
        console.log('4. Creating default settings...');
        const settingsData = [
            ['system_name', 'Gym Locker Management System'],
            ['auto_assign_enabled', 'true'],
            ['rfid_required', 'true'],
            ['max_locker_duration', '24'],
            ['cleanup_interval', '3600'],
            ['mqtt_enabled', 'true'],
            ['mqtt_broker_host', 'localhost'],
            ['mqtt_broker_port', '1883']
        ];
        
        for (const [key, value] of settingsData) {
            await connection.execute(`
                INSERT IGNORE INTO settings (setting_key, setting_value, created_at, updated_at)
                VALUES (?, ?, NOW(), NOW())
            `, [key, value]);
        }
        
        console.log('Data initialization completed successfully');
        
    } catch (error) {
        console.error('Error during data initialization:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    initializeData()
        .then(() => {
            console.log('Data initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Data initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeData }; 