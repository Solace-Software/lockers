const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const tcpPortUsed = require('tcp-port-used');
const findProcess = require('find-process');

// Configuration
const DEFAULT_PORTS = {
  backend: 3001,
  frontend: 3000
};

const PROJECT_ROOT = path.resolve(__dirname, '..');
const GYM_LOCKERS_DIR = path.join(PROJECT_ROOT, 'gym_lockers');
const CLIENT_DIR = path.join(GYM_LOCKERS_DIR, 'client');

// Global state
let backendProcess = null;
let frontendProcess = null;

// Helper functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✖'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠'), msg)
};

async function findAvailablePort(startPort) {
  let port = startPort;
  while (await tcpPortUsed.check(port)) {
    log.warning(`Port ${port} is in use, trying next port...`);
    port++;
  }
  return port;
}

async function killProcessOnPort(port) {
  try {
    const processes = await findProcess('port', port);
    for (const proc of processes) {
      log.warning(`Killing process ${proc.pid} on port ${port}`);
      process.kill(proc.pid);
    }
  } catch (err) {
    log.error(`Failed to kill process on port ${port}: ${err.message}`);
  }
}

function startBackend(port) {
  return new Promise((resolve, reject) => {
    log.info('Starting backend server...');
    
    const env = { ...process.env, PORT: port };
    backendProcess = spawn('node', ['server.js'], {
      cwd: GYM_LOCKERS_DIR,
      env,
      stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
      log.error(`Backend failed to start: ${err.message}`);
      reject(err);
    });

    // Wait for the port to be in use
    const checkPort = async () => {
      try {
        await tcpPortUsed.waitUntilUsed(port, 500, 30000);
        log.success(`Backend server started on port ${port}`);
        resolve();
      } catch (err) {
        log.error(`Backend server failed to start: ${err.message}`);
        reject(err);
      }
    };

    checkPort();
  });
}

function startFrontend(port) {
  return new Promise((resolve, reject) => {
    log.info('Starting frontend server...');
    
    const env = { ...process.env, PORT: port };
    frontendProcess = spawn('npm', ['start'], {
      cwd: CLIENT_DIR,
      env,
      stdio: 'inherit'
    });

    frontendProcess.on('error', (err) => {
      log.error(`Frontend failed to start: ${err.message}`);
      reject(err);
    });

    // Wait for the port to be in use
    const checkPort = async () => {
      try {
        await tcpPortUsed.waitUntilUsed(port, 500, 30000);
        log.success(`Frontend server started on port ${port}`);
        resolve();
      } catch (err) {
        log.error(`Frontend server failed to start: ${err.message}`);
        reject(err);
      }
    };

    checkPort();
  });
}

async function cleanup() {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
  process.exit(0);
}

// Handle cleanup
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main function
async function main() {
  try {
    const forceStart = process.argv.includes('--force');
    
    // Find available ports
    let backendPort = DEFAULT_PORTS.backend;
    let frontendPort = DEFAULT_PORTS.frontend;

    if (forceStart) {
      log.warning('Force flag detected, killing existing processes...');
      await killProcessOnPort(backendPort);
      await killProcessOnPort(frontendPort);
    } else {
      backendPort = await findAvailablePort(backendPort);
      frontendPort = await findAvailablePort(frontendPort);
    }

    // Start services
    await startBackend(backendPort);
    await startFrontend(frontendPort);

    // Show final status
    log.success('\nAll services are running:');
    console.log(chalk.blue('Frontend:'), chalk.green(`http://localhost:${frontendPort}`));
    console.log(chalk.blue('Backend: '), chalk.green(`http://localhost:${backendPort}`));
    console.log(chalk.yellow('\nPress Ctrl+C to stop all services'));

  } catch (error) {
    log.error(`Failed to start services: ${error.message}`);
    await cleanup();
  }
}

// Run the application
main();