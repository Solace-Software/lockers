#!/usr/bin/env node

const { execSync } = require('child_process');
const killPort = require('kill-port');

const PORT = 3001;

async function startServer() {
    console.log('Starting Gym Locker Admin Dashboard...\n');
    
    try {
        // Check if port is already in use
        console.log(`Checking for processes on port ${PORT}...`);
        
        try {
            const result = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' }).trim();
            if (result) {
                const pids = result.split('\n').filter(pid => pid.trim());
                console.log(`Found ${pids.length} process(es) on port ${PORT}, killing them...`);
                
                try {
                    execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'inherit' });
                    console.log(`Could not kill some processes on port ${PORT} (they may have already exited)`);
                } catch (killError) {
                    console.log(`Successfully freed port ${PORT}`);
                }
                
                // Wait a moment for processes to fully terminate
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.log(`Port ${PORT} is free`);
        }
        
        // Start the server
        console.log('\nStarting backend server...');
        
        // Import and start the server
        const server = require('./server');
        
        // The server will start automatically when imported
        console.log(`Server is running on port ${PORT}`);
        
    } catch (error) {
        console.error('Error starting server:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});

// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

console.log('Port cleanup complete, starting server...'); 