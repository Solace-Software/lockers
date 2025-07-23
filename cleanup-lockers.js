const axios = require('axios');

async function removeAllLockers() {
  try {
    // Get all lockers
    const response = await axios.get('http://localhost:3000/api/lockers');
    const lockers = response.data;
    
    console.log(`Found ${lockers.length} lockers to remove...`);
    
    // Delete each locker
    for (const locker of lockers) {
      try {
        await axios.delete(`http://localhost:3000/api/lockers/${locker.id}`);
        console.log(`✅ Successfully deleted locker: ${locker.name} (ID: ${locker.id})`);
      } catch (error) {
        console.error(`❌ Failed to delete locker ${locker.name} (ID: ${locker.id}):`, error.message);
      }
    }
    
    console.log('\nLocker cleanup completed!');
  } catch (error) {
    console.error('Failed to fetch lockers:', error.message);
  }
}

removeAllLockers(); 