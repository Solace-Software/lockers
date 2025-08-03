#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const DEFAULT_PORT = 3001;
let currentPort = process.env.PORT || DEFAULT_PORT;

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

function startServer(port) {
  console.log(`\n🖥️  Starting backend server on port ${port}...`);
  const serverProcess = exec(`PORT=${port} node server.js`, { cwd: __dirname });
  
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
    // Try to find an available port
    let portAvailable = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!portAvailable && attempts < maxAttempts) {
      try {
        await killProcessOnPort(currentPort);
        portAvailable = true;
      } catch (error) {
        console.log(`⚠️ Port ${currentPort} is in use, trying next port...`);
        currentPort++;
        attempts++;
      }
    }

    if (!portAvailable) {
      throw new Error(`Could not find available port after ${maxAttempts} attempts`);
    }

    console.log(`🎯 Using port ${currentPort}`);
    startServer(currentPort);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main(); 