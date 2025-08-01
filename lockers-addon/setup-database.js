#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDatabase() {
  console.log('🔧 Database Configuration Setup');
  console.log('================================\n');
  
  console.log('This script will help you configure the database connection for the Gym Locker Admin Dashboard.\n');
  
  const config = {
    db_host: await question('Database host (default: localhost): ') || 'localhost',
    db_port: parseInt(await question('Database port (default: 3306): ') || '3306'),
    db_user: await question('Database user (default: root): ') || 'root',
    db_password: await question('Database password: '),
    db_name: await question('Database name (default: gym_lockers): ') || 'gym_lockers'
  };
  
  const configPath = path.join(__dirname, 'local-config.json');
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('\n✅ Configuration saved to local-config.json');
    console.log('\n📋 Configuration:');
    console.log(`   Host: ${config.db_host}`);
    console.log(`   Port: ${config.db_port}`);
    console.log(`   User: ${config.db_user}`);
    console.log(`   Database: ${config.db_name}`);
    console.log('\n🚀 You can now start the server with: node server.js');
  } catch (error) {
    console.error('❌ Error saving configuration:', error.message);
  }
  
  rl.close();
}

setupDatabase().catch(console.error); 