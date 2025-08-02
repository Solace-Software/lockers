#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Gym Locker Dashboard for Local Development...');

// Check if client is built
const buildPath = path.join(__dirname, 'client', 'build');
if (!fs.existsSync(buildPath)) {
  console.log('📦 Building client application...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit'
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Client built successfully');
      startServer();
    } else {
      console.error('❌ Client build failed');
      process.exit(1);
    }
  });
} else {
  console.log('✅ Client build found');
  startServer();
}

function startServer() {
  console.log('🖥️  Starting server...');
  
  // Set environment for local development
  process.env.NODE_ENV = 'development';
  process.env.LOCAL_DEV = 'true';
  
  // Start the server
  const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`🛑 Server exited with code ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    serverProcess.kill('SIGTERM');
  });
} 