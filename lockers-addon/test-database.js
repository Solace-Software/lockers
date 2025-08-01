#!/usr/bin/env node

const Database = require('./database');

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...\n');
  
  const db = new Database();
  
  try {
    console.log('🔌 Attempting to connect to database...');
    await db.connect();
    console.log('✅ Database connection successful!');
    
    console.log('\n📊 Testing basic operations...');
    
    // Test getting all users (should work even if table is empty)
    const users = await db.getAllUsers();
    console.log(`✅ Users table accessible (${users.length} users found)`);
    
    // Test getting all lockers
    const lockers = await db.getAllLockers();
    console.log(`✅ Lockers table accessible (${lockers.length} lockers found)`);
    
    // Test getting all groups
    const groups = await db.getAllGroups();
    console.log(`✅ Groups table accessible (${groups.length} groups found)`);
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Check if MariaDB/MySQL is running');
    console.error('2. Verify database credentials in local-config.json');
    console.error('3. Ensure the database exists');
    console.error('4. Check network connectivity to database host');
    process.exit(1);
  } finally {
    await db.close();
    console.log('\n🔌 Database connection closed');
  }
}

testDatabaseConnection().catch(console.error); 