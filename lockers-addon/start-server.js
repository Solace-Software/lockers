#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const SERVER_PORT = 3001;

console.log('🚀 Starting Gym Locker Admin Dashboard...\n');

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`🔍 Checking for processes on port ${port}...`);
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is free`);
        resolve();
        return;
      }
      const pids = stdout.trim().split('\n');
      console.log(`⚠️  Found ${pids.length} process(es) on port ${port}, killing them...`);
      exec(`lsof -ti:${port} | xargs kill -9`, (killError) => {
        if (killError) {
          console.log(`⚠️  Could not kill some processes on port ${port} (they may have already exited)`);
        } else {
          console.log(`✅ Successfully freed port ${port}`);
        }
        // Wait a moment for the port to be fully released
        setTimeout(resolve, 1000);
      });
    });
  });
}

function startServer() {
  console.log('\n🖥️  Starting backend server...');
  const serverProcess = exec('node server.js', { cwd: __dirname });
  
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n❌ Server process exited with code ${code}`);
    process.exit(code || 1);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

async function main() {
  try {
    // Clean up any existing processes on port 3001
    await killProcessOnPort(SERVER_PORT);
    console.log('🎯 Port cleanup complete, starting server...');
    startServer();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main(); 