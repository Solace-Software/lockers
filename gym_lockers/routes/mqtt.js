const express = require('express');
const mqtt = require('mqtt');
const router = express.Router();

// Test MQTT connection
router.post('/test', async (req, res) => {
  const { host, port, username, password, ssl } = req.body;
  
  if (!host || !port) {
    return res.status(400).json({ 
      success: false, 
      error: 'Host and port are required' 
    });
  }

  try {
    // Create MQTT client options
    const options = {
      host: host,
      port: port,
      protocol: ssl ? 'mqtts' : 'mqtt',
      username: username || undefined,
      password: password || undefined,
      clientId: `test-client-${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 0 // Disable auto-reconnect for testing
    };

    // Create test client
    const testClient = mqtt.connect(options);

    // Set up event handlers
    testClient.on('connect', () => {
      console.log('MQTT test connection successful');
      testClient.end();
      res.json({ 
        success: true, 
        message: 'MQTT connection test successful',
        details: {
          host,
          port,
          protocol: ssl ? 'mqtts' : 'mqtt',
          authenticated: !!(username && password)
        }
      });
    });

    testClient.on('error', (error) => {
      console.error('MQTT test connection error:', error);
      testClient.end();
      res.json({ 
        success: false, 
        error: 'MQTT connection failed',
        details: error.message
      });
    });

    testClient.on('timeout', () => {
      console.error('MQTT test connection timeout');
      testClient.end();
      res.json({ 
        success: false, 
        error: 'MQTT connection timeout',
        details: 'Connection attempt timed out after 10 seconds'
      });
    });

    // Set timeout for the entire test
    setTimeout(() => {
      if (testClient.connected === false) {
        testClient.end();
        res.json({ 
          success: false, 
          error: 'MQTT connection timeout',
          details: 'Connection attempt timed out'
        });
      }
    }, 12000);

  } catch (error) {
    console.error('MQTT test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get MQTT broker status
router.get('/status', (req, res) => {
  // This would typically check the actual MQTT broker status
  // For now, return a basic status
  res.json({
    status: 'connected', // This should come from the actual MQTT client
    broker: {
      host: process.env.MQTT_HOST || 'localhost',
      port: process.env.MQTT_PORT || 1883,
      protocol: 'mqtt'
    },
    connections: 0, // This should come from the actual broker
    uptime: 0 // This should come from the actual broker
  });
});

// Get MQTT topics (if supported by the broker)
router.get('/topics', (req, res) => {
  // This would typically query the MQTT broker for active topics
  // For now, return some common topics
  res.json({
    topics: [
      'gym/lockers/+/status',
      'gym/lockers/+/rfid',
      'gym/lockers/+/command',
      'gym/system/heartbeat'
    ]
  });
});

module.exports = router;
