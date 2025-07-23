#!/usr/bin/env node

const { exec } = require('child_process');

const PORTS = [3000, 3001, 5000]; // Common ports that might conflict

console.log('🧹 Cleaning up processes on common ports...\n');

function killProcessOnPort(port) {
  return new Promise((resolve) => {
    console.log(`🔍 Checking port ${port}...`);
    
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log(`✅ Port ${port} is already free`);
        resolve();
        return;
      }

      const pids = stdout.trim().split('\n');
      console.log(`⚠️  Found ${pids.length} process(es) on port ${port}`);
      
      // Show what processes are running
      exec(`lsof -i:${port}`, (lsofError, lsofOutput) => {
        if (!lsofError && lsofOutput) {
          console.log(`   Processes: ${lsofOutput.split('\n').slice(1).join(', ')}`);
        }
        
        // Kill the processes
        exec(`lsof -ti:${port} | xargs kill -9`, (killError) => {
          if (killError) {
            console.log(`⚠️  Could not kill some processes on port ${port}`);
          } else {
            console.log(`✅ Successfully freed port ${port}`);
          }
          resolve();
        });
      });
    });
  });
}

async function main() {
  try {
    for (const port of PORTS) {
      await killProcessOnPort(port);
    }
    
    console.log('\n🎉 Port cleanup complete!');
    console.log('💡 You can now start the server with: npm run server');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

main(); 