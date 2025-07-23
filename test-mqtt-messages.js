const mqtt = require('mqtt');

// Connect to MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('🔗 Connected to MQTT broker');
  console.log('📡 Starting Rubik locker function tests...\n');
  
  // Test messages for different locker functions
  const messages = [
    // Test unlock command
    { 
      topic: 'lockers/send', 
      payload: { 
        cmd: 'openlock', 
        lock: 2, 
        doorip: '192.168.68.112',
        uid: '12345'  // User ID is required for Rubik lockers
      }
    },
    // Test maintenance mode
    { 
      topic: 'lockers/send', 
      payload: { 
        cmd: 'maintenance', 
        lock: 2, 
        doorip: '192.168.68.112',
        uid: '12345'
      }
    },
    // Test normal mode
    { 
      topic: 'lockers/send', 
      payload: { 
        cmd: 'normal', 
        lock: 2, 
        doorip: '192.168.68.112',
        uid: '12345'
      }
    },
    // Test heartbeat - represents 2 lockers (F1A and F1B)
    { 
      topic: 'lockers/send', 
      payload: { 
        type: 'heartbeat',
        hostname: 'F1-2', // Format: {locker_name}-{numlock}
        ip: '192.168.68.112',
        controllertype: 'locker',
        numlocks: 2, // Each heartbeat represents 2 lockers
        uptime: 3600,
        time: Math.floor(Date.now() / 1000)  // Unix timestamp required by Rubik
      }
    },
    // Test heartbeat for different locker (G3A and G3B)
    { 
      topic: 'lockers/send', 
      payload: { 
        type: 'heartbeat',
        hostname: 'G3-4', // Format: {locker_name}-{numlock}
        ip: '192.168.68.113',
        controllertype: 'locker',
        numlocks: 2, // Each heartbeat represents 2 lockers
        uptime: 7200,
        time: Math.floor(Date.now() / 1000)  // Unix timestamp required by Rubik
      }
    },
    // Test sync message
    { 
      topic: 'lockers/send', 
      payload: { 
        cmd: 'sync',
        doorip: '192.168.68.112',
        lock: 2,
        uid: '12345'
      }
    },
    // Test access log
    { 
      topic: 'lockers/send', 
      payload: { 
        cmd: 'log',
        type: 'access',
        time: Math.floor(Date.now() / 1000),  // Unix timestamp
        isKnown: 'true',
        access: 'Always',
        username: 'Test User',
        uid: '12345',
        door: 'F1-2'
      }
    }
  ];
  
  let index = 0;
  
  const sendMessage = () => {
    if (index < messages.length) {
      const msg = messages[index];
      console.log(`\n📤 Testing: ${msg.payload.cmd || msg.payload.type}`);
      console.log(`📤 Sending to ${msg.topic}:`, JSON.stringify(msg.payload));
      client.publish(msg.topic, JSON.stringify(msg.payload));
      index++;
      setTimeout(sendMessage, 2000); // Send next message after 2 seconds
    } else {
      console.log('\n✅ All Rubik locker function tests completed');
      console.log('💡 Check the server logs to verify each function');
      console.log('🛑 Press Ctrl+C to exit');
    }
  };
  
  // Start sending test messages after 1 second
  setTimeout(sendMessage, 1000);
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