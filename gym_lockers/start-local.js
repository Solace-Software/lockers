#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Gym Locker Dashboard for Local Development...');

// Check if client build exists
const clientBuildPath = path.join(__dirname, 'client', 'build');
const clientPublicPath = path.join(__dirname, 'client', 'public');

if (fs.existsSync(clientBuildPath)) {
    console.log('Client build found');
} else {
    console.log('Building client...');
    try {
        execSync('npm run build', { cwd: path.join(__dirname, 'client'), stdio: 'inherit' });
        console.log('Client built successfully');
    } catch (error) {
        console.error('Failed to build client:', error.message);
        process.exit(1);
    }
}

// Start the server
console.log('Starting server...');
try {
    execSync('node server.js', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
    console.error('Server failed:', error.message);
    process.exit(1);
} 