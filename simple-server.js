#!/usr/bin/env node

const { exec } = require('child_process');

const PORT = process.env.PORT || 3001;

console.log(`🚀 Starting server on port ${PORT}...`);

// Function to kill processes on a specific port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is available`);
        resolve();
        return;
      }

      const pids = stdout.trim().split('\n');
      console.log(`⚠️  Killing ${pids.length} process(es) on port ${port}...`);
      
      exec(`lsof -ti:${port} | xargs kill -9`, (killError) => {
        if (killError) {
          console.log(`⚠️  Some processes on port ${port} may still be running`);
        } else {
          console.log(`✅ Port ${port} is now free`);
        }
        resolve();
      });
    });
  });
}

// Start the server
async function startServer() {
  try {
    // Clean up the port first
    await killProcessOnPort(PORT);
    
    console.log('🔄 Starting server...');
    
    // Set the PORT environment variable and start the server
    const serverProcess = exec(`PORT=${PORT} node server.js`, { cwd: __dirname });
    
    serverProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    serverProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`\n🔚 Server exited with code ${code}`);
      process.exit(code);
    });

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      serverProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      serverProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 