const mqtt = require('mqtt');

// Connect to MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('🔗 Connected to MQTT broker');
  console.log('📡 Testing RFID scan functionality...\n');
  
  // Test RFID scan for existing user
  const rfidScanMessage = {
    topic: 'lockers/send',
    payload: {
      cmd: 'log',
      type: 'access',
      time: Math.floor(Date.now() / 1000),
      isKnown: 'true',
      access: 'Always',
      username: 'Guest User',
      uid: 'd6a7a37d', // This matches the existing user's RFID tag
      door: 'F19-20' // This should match the user's assigned locker group
    }
  };
  
  console.log('🔍 Testing RFID scan for existing user...');
  console.log(`📤 Sending to ${rfidScanMessage.topic}:`, JSON.stringify(rfidScanMessage.payload));
  console.log('⏰ This should trigger a 10-second delay before unlock...');
  
  client.publish(rfidScanMessage.topic, JSON.stringify(rfidScanMessage.payload));
  
  // Test unknown RFID tag
  setTimeout(() => {
    const unknownRfidMessage = {
      topic: 'lockers/send',
      payload: {
        cmd: 'log',
        type: 'access',
        time: Math.floor(Date.now() / 1000),
        isKnown: 'false',
        access: 'Denied',
        username: '',
        uid: 'unknown123', // Unknown RFID tag
        door: 'M7-8'
      }
    };
    
    console.log('\n🔍 Testing RFID scan for unknown user...');
    console.log(`📤 Sending to ${unknownRfidMessage.topic}:`, JSON.stringify(unknownRfidMessage.payload));
    
    client.publish(unknownRfidMessage.topic, JSON.stringify(unknownRfidMessage.payload));
  }, 15000); // Wait 15 seconds after first test
  
  // Exit after tests
  setTimeout(() => {
    console.log('\n✅ RFID scan tests completed');
    console.log('💡 Check the server logs to verify the delay functionality');
    console.log('🛑 Press Ctrl+C to exit');
  }, 30000);
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Closing MQTT connection...');
  client.end();
  process.exit(0);
}); 