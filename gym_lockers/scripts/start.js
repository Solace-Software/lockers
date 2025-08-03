const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const kill = require('tree-kill');

// Configuration
const DEFAULT_BACKEND_PORT = 3001;
const DEFAULT_FRONTEND_PORT = 3000;
const MAX_PORT_ATTEMPTS = 10;

// Helper to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Find next available port
async function findAvailablePort(startPort) {
  let port = startPort;
  let attempts = 0;

  while (attempts < MAX_PORT_ATTEMPTS) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port++;
    attempts++;
  }

  throw new Error(`No available ports found after ${MAX_PORT_ATTEMPTS} attempts`);
}

// Kill process on port
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', async () => {
      // Port is in use, try to kill the process
      console.log(`⚠️ Attempting to free port ${port}...`);
      
      if (process.platform === 'win32') {
        await spawn('cmd', ['/c', `netstat -ano | findstr :${port}`]);
      } else {
        const lsof = spawn('lsof', ['-i', `:${port}`]);
        lsof.stdout.on('data', (data) => {
          const lines = data.toString().split('\n');
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 1) {
              const pid = parts[1];
              if (pid && !isNaN(pid)) {
                try {
                  kill(parseInt(pid));
                  console.log(`✅ Successfully killed process ${pid} on port ${port}`);
                } catch (err) {
                  console.log(`❌ Failed to kill process ${pid}: ${err.message}`);
                }
              }
            }
          });
        });
      }
      
      // Wait a bit for the process to be killed
      setTimeout(resolve, 1000);
    });
    
    server.once('listening', () => {
      server.close();
      resolve();
    });
    
    server.listen(port);
  });
}

// Start a process with port management
async function startProcess(command, args, options, port, name) {
  try {
    // First try to kill any process on the target port
    await killProcessOnPort(port);
    
    // Then find an available port
    const availablePort = await findAvailablePort(port);
    if (availablePort !== port) {
      console.log(`ℹ️ ${name} will use port ${availablePort} instead of ${port}`);
    }
    
    // Update environment with the port
    const env = {
      ...process.env,
      PORT: availablePort.toString(),
    };

    // Start the process
    const proc = spawn(command, args, {
      ...options,
      env,
      stdio: 'inherit',
    });

    // Handle process events
    proc.on('error', (err) => {
      console.error(`❌ ${name} failed to start:`, err);
    });

    return { process: proc, port: availablePort };
  } catch (error) {
    console.error(`❌ Failed to start ${name}:`, error);
    throw error;
  }
}

// Main startup function
async function startServices() {
  console.log('🚀 Starting services...');
  
  try {
    // Start backend
    console.log('ℹ Starting backend server...');
    const backend = await startProcess(
      'node',
      ['server.js'],
      { cwd: path.join(__dirname, '..', 'gym_lockers') },
      DEFAULT_BACKEND_PORT,
      'Backend'
    );

    // Wait a bit for backend to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start frontend
    console.log('ℹ Starting frontend...');
    const frontend = await startProcess(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['start'],
      { cwd: path.join(__dirname, '..', 'gym_lockers', 'client') },
      DEFAULT_FRONTEND_PORT,
      'Frontend'
    );

    // Handle cleanup on exit
    const cleanup = () => {
      console.log('\n🧹 Cleaning up...');
      if (backend.process) kill(backend.process.pid);
      if (frontend.process) kill(frontend.process.pid);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

  } catch (error) {
    console.error('✖ Failed to start services:', error.message);
    process.exit(1);
  }
}

// Start everything
startServices().catch(error => {
  console.error('✖ Fatal error:', error);
  process.exit(1);
});