const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import database
const Database = require('./database');
const settingsRoutes = require('./routes/settings');
const mqttRoutes = require('./routes/mqtt');

const app = express();
let server = null;
let io = null;

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Serve static files from both possible locations
const staticPaths = [
  path.join(__dirname, 'client_build'),
  path.join(__dirname, 'client/build')
];

staticPaths.forEach(staticPath => {
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    console.log(`📁 Serving static files from: ${staticPath}`);
  }
});

const { mqttConfig: addonMqttConfig, mqttEnabled } = require('./config');

// MQTT Configuration - Dynamic settings from API
let mqttConfig = addonMqttConfig ? {
  host: addonMqttConfig.host,
  port: addonMqttConfig.port,
  username: addonMqttConfig.username,
  password: addonMqttConfig.password,
  clientId: addonMqttConfig.clientId
} : null;

// Settings storage (in production, use a database)
let systemSettings = {
  mqttConfig: mqttConfig,
  notifications: {
    emailAlerts: true,
    usageReports: false,
    realTimeUpdates: true
  },
  systemSettings: {
    autoRefresh: 30,
    dataRetention: 90,
    backupEnabled: true,
    debugMode: false,
    lockerExpiryHours: 24
  }
};

// MQTT connection management
let mqttClient = null;
let isConnecting = false;
let isConnected = false;

// --- MQTT Status Tracking ---
let mqttStatus = 'disconnected'; // 'connected' | 'disconnected'

// Database instance
const db = new Database();

// In-memory cache for frequently accessed data (optional optimization)
let lockersCache = [];
let usersCache = [];
let groupsCache = [];

// Offline detection interval (5 minutes)
const OFFLINE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
let offlineCheckInterval = null;

// Locker expiry check interval (every 10 minutes)
const EXPIRY_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
let expiryCheckInterval = null;

// --- MQTT Connection Management with Resilient Reconnect ---
let mqttReconnectDelay = 5000; // Start with 5 seconds
const MQTT_RECONNECT_MAX = 60000; // Max 60 seconds

// Connect to MQTT Broker using current settings
function connectMQTT() {
  if (isConnecting || isConnected) {
    console.log('🔄 MQTT already connected or connecting, skipping...');
    return;
  }

  // Check if MQTT is enabled and configured
  if (!mqttEnabled || !mqttConfig) {
    console.log('⚠️ MQTT is not enabled or not configured. The application will run without MQTT connectivity.');
    console.log('📝 You can configure MQTT settings through the web interface.');
    mqttStatus = 'disabled';
    return;
  }

  isConnecting = true;

  try {
    if (mqttClient) {
      console.log('🧹 Cleaning up existing MQTT client...');
      try {
        mqttClient.removeAllListeners();
        mqttClient.end(true);
      } catch (error) {
        console.error('⚠️ Error cleaning up MQTT client:', error);
      }
      mqttClient = null;
      isConnected = false;
    }

    console.log('🔌 Connecting to MQTT broker...', {
      host: mqttConfig.host,
      port: mqttConfig.port,
      clientId: mqttConfig.clientId
    });

    mqttClient = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`, {
      clientId: mqttConfig.clientId,
      username: mqttConfig.username || undefined,
      password: mqttConfig.password || undefined,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 0, // We'll handle reconnection manually
      keepalive: 60,
      protocolVersion: 4,
      resubscribe: true,
      queueQoSZero: true
    });

    mqttClient.on('error', (error) => {
      isConnecting = false;
      isConnected = false;
      mqttStatus = 'disconnected';
      console.error('❌ MQTT connection error:', error.message);
      scheduleMqttReconnect();
    });

    mqttClient.on('connect', () => {
      isConnecting = false;
      isConnected = true;
      mqttStatus = 'connected';
      mqttReconnectDelay = 5000; // Reset delay on success
      console.log('✅ Connected to MQTT broker');
      // Subscribe to specific locker-related topics instead of all topics
      const topics = [
        'lockers/#',           // All locker-related topics
        'locker/#',            // Alternative locker topic format
        'rubik/#',             // Rubik locker topics
        'heartbeat/#',         // Heartbeat messages
        'test/#',              // Test messages for debugging
        '+/sync',              // Any device sync messages
        '+/send',              // Any device send messages
        '+/accesslist',        // Any device access list messages
        '+/cmd'                // Any device command messages
      ];
      
      mqttClient.subscribe(topics, (err) => {
        if (err) {
          console.error('❌ Failed to subscribe to topics:', err);
        } else {
          console.log('📡 Subscribed to locker-specific topics:', topics);
        }
      });
    });

    mqttClient.on('close', () => {
      const wasConnected = isConnected;
      isConnected = false;
      isConnecting = false;
      mqttStatus = 'disconnected';
      if (wasConnected) {
        console.log('🔌 MQTT connection closed');
      }
      scheduleMqttReconnect();
    });

    mqttClient.on('disconnect', () => {
      isConnected = false;
      isConnecting = false;
      mqttStatus = 'disconnected';
      console.log('🔌 MQTT disconnected');
      scheduleMqttReconnect();
    });

    mqttClient.on('offline', () => {
      isConnected = false;
      mqttStatus = 'disconnected';
      console.warn('📴 MQTT client offline');
      scheduleMqttReconnect();
    });

    mqttClient.on('end', () => {
      isConnected = false;
      isConnecting = false;
      mqttStatus = 'disconnected';
      console.log('🔚 MQTT client ended');
      scheduleMqttReconnect();
    });

    mqttClient.on('message', handleMqttMessage);

    // Catch unhandled errors to prevent crash
    mqttClient.on('uncaughtException', (err) => {
      console.error('❌ Uncaught MQTT Exception:', err);
      scheduleMqttReconnect();
    });

  } catch (error) {
    isConnecting = false;
    isConnected = false;
    console.error('❌ Failed to create MQTT client:', error);
    scheduleMqttReconnect();
  }
}

function scheduleMqttReconnect() {
  if (isConnecting || isConnected) return;
  console.log(`🔄 Scheduling MQTT reconnect in ${Math.floor(mqttReconnectDelay / 1000)}s...`);
  setTimeout(() => {
    if (!isConnected && !isConnecting) {
      connectMQTT();
      mqttReconnectDelay = Math.min(mqttReconnectDelay * 2, MQTT_RECONNECT_MAX);
    }
  }, mqttReconnectDelay);
}

// Helper function to get configured locker expiry time
async function getLockerExpiryTime() {
  try {
    const settings = await db.getAllSettings();
    const systemSettings = settings.find(s => s.key === 'systemSettings');
    
    console.log('🔍 getLockerExpiryTime CALLED - systemSettings found:', !!systemSettings);
    
    // Force to 60 minutes (1 hour) based on the settings page value
    let minutes = 60; // Use 60 minutes as configured in settings
    
    if (systemSettings && systemSettings.value) {
      // Parse the value if it's a string (which it usually is from database)
      let settingsObj = systemSettings.value;
      if (typeof settingsObj === 'string') {
        try {
          settingsObj = JSON.parse(settingsObj);
        } catch (parseError) {
          console.error('❌ Failed to parse settings JSON:', parseError);
        }
      }
      
      // Use lockerExpiryMinutes if available, otherwise convert from legacy lockerExpiryHours
      if (settingsObj && settingsObj.lockerExpiryMinutes && settingsObj.lockerExpiryMinutes > 0) {
        minutes = settingsObj.lockerExpiryMinutes;
        console.log(`✅ Using lockerExpiryMinutes from DB: ${minutes}`);
      } else if (settingsObj && settingsObj.lockerExpiryHours && settingsObj.lockerExpiryHours > 0) {
        minutes = settingsObj.lockerExpiryHours * 60;
        console.log(`✅ Using lockerExpiryHours from DB: ${settingsObj.lockerExpiryHours} * 60 = ${minutes}`);
      } else {
        console.log('⚠️ No valid expiry setting found in DB, using configured 60 minutes');
      }
    } else {
      console.log('⚠️ No systemSettings found in DB, using configured 60 minutes');
    }
    
    console.log(`🕐 FINAL CALCULATION: ${minutes} minutes from now`);
    return new Date(Date.now() + minutes * 60 * 1000);
  } catch (error) {
    console.error('❌ Error getting locker expiry time from settings:', error);
    // Default to 60 minutes (1 hour) on error - FIXED from 24 hours
    console.log('⚠️ Error occurred, using 60 minutes default');
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}

// Function to check and expire locker assignments
async function checkExpiredLockers() {
  try {
    console.log('🕐 Checking for expired locker assignments...');
    
    const allUsers = await db.getAllUsers();
    const allLockers = await db.getAllLockers();
    const now = new Date();
    
    let expiredCount = 0;
    let orphanedCount = 0;
    
    // First pass: Handle normal expiration based on user assignments
    for (const user of allUsers) {
      if (user.locker_id && user.valid_until) {
        const expiryDate = new Date(user.valid_until);
        
        if (expiryDate <= now) {
          console.log(`⏰ Expiring locker assignment for user ${user.username} (expired: ${expiryDate.toISOString()})`);
          
          // Find the locker
          const locker = allLockers.find(l => l.id === user.locker_id);
          
          if (locker) {
            try {
              // Update user - remove locker assignment
              await db.updateUser(user.id, {
                locker_id: null,
                valid_until: null
              });
              
              // Update locker - set to available
              await db.updateLocker(locker.id, {
                status: 'available',
                user_id: null
              });
              
              // Send MQTT command to remove user from locker
              if (mqttClient && isConnected) {
                const command = {
                  cmd: "deluser",
                  doorip: locker.ip_address,
                  uid: user.id
                };
                
                mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
                console.log(`📡 Sent deluser command for expired assignment: ${JSON.stringify(command)}`);
              }
              
              // Log activity
              await db.logActivity({
                user_id: user.id,
                locker_id: locker.id,
                action: 'auto_expire_locker',
                details: { 
                  lockerId: locker.id, 
                  userId: user.id, 
                  expiryDate: user.valid_until,
                  expiredAt: now.toISOString()
                }
              });
              
              // Emit socket events for real-time updates
              if (io) {
                io.emit('locker-updated', { ...locker, status: 'available', user_id: null });
                io.emit('user-updated', { ...user, locker_id: null, valid_until: null });
              }
              
              expiredCount++;
            } catch (error) {
              console.error(`❌ Error expiring locker ${locker.name} for user ${user.id}:`, error);
            }
          }
        }
      }
    }
    
    // Second pass: Clean up orphaned lockers (occupied but user has no assignment)
    for (const locker of allLockers) {
      if (locker.status === 'occupied' && locker.user_id) {
        const user = allUsers.find(u => u.id === locker.user_id);
        
        // If user doesn't exist or user has no locker assignment, this is orphaned
        if (!user || !user.locker_id || user.locker_id !== locker.id) {
          console.log(`🧹 Cleaning up orphaned locker: ${locker.name} (${locker.locker_id}) - was assigned to user ${locker.user_id}`);
          
          try {
            // Update locker - set to available and clear user assignment
            await db.updateLocker(locker.id, {
              status: 'available',
              user_id: null
            });
            
            // Send MQTT command to remove user from locker (if connected)
            if (mqttClient && isConnected) {
              const command = {
                cmd: "deluser",
                doorip: locker.ip_address,
                uid: locker.user_id
              };
              
              mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
              console.log(`📡 Sent deluser command for orphaned locker: ${JSON.stringify(command)}`);
            }
            
            // Log activity
            await db.logActivity({
              user_id: locker.user_id,
              locker_id: locker.id,
              action: 'cleanup_orphaned_locker',
              details: { 
                lockerId: locker.id, 
                userId: locker.user_id,
                reason: 'Locker was occupied but user had no assignment',
                cleanedAt: now.toISOString()
              }
            });
            
            // Emit socket events for real-time updates
            if (io) {
              io.emit('locker-updated', { ...locker, status: 'available', user_id: null });
            }
            
            orphanedCount++;
          } catch (error) {
            console.error(`❌ Error cleaning up orphaned locker ${locker.name}:`, error);
          }
        }
      }
    }
    
    if (expiredCount > 0 || orphanedCount > 0) {
      console.log(`✅ Expired ${expiredCount} locker assignment(s) and cleaned up ${orphanedCount} orphaned locker(s)`);
      // Update caches after expiring assignments
      lockersCache = await db.getAllLockers();
      usersCache = await db.getAllUsers();
    } else {
      console.log('✅ No expired locker assignments or orphaned lockers found');
    }
    
  } catch (error) {
    console.error('❌ Error checking expired lockers:', error);
  }
}

// Handle MQTT messages - now handles Rubik locker protocol
async function handleMqttMessage(topic, message) {
  if (!topic || !message) {
    console.error('❌ Invalid MQTT message received:', { topic, message });
    return;
  }

  // Filter out non-locker related topics to prevent processing irrelevant messages
  const relevantTopics = [
    'lockers',
    'locker', 
    'rubik',
    'heartbeat',
    'test'
  ];
  
  const topicParts = topic.split('/');
  const baseTopic = topicParts[0];
  
  // Skip processing if topic doesn't match any relevant base topics
  if (!relevantTopics.some(relevant => baseTopic.toLowerCase().includes(relevant.toLowerCase()))) {
    console.log(`⏭️ Skipping irrelevant topic: ${topic}`);
    return;
  }

  try {
    // Check message size to prevent processing very large messages (like images)
    const messageSize = message.length;
    if (messageSize > 10000) { // 10KB limit
      console.log(`⏭️ Skipping large message (${messageSize} bytes) on topic: ${topic}`);
      return;
    }
    
    console.log(`📨 MQTT Message received on ${topic}: ${message.toString()}`);
    
    let payload;
    try {
      payload = JSON.parse(message.toString());
      console.log(`🔍 Processing topic: ${topic}`);
      console.log(`📋 Payload:`, payload);
    } catch (error) {
      // If not JSON, still log the raw message
      console.log(`📨 Raw MQTT Message on ${topic}: ${message.toString()}`);
      payload = { raw: message.toString() };
      console.log(`🔍 Processing topic: ${topic}`);
      console.log(`📋 Payload:`, payload);
    }
  
  // Save MQTT message to database
  try {
    await db.saveMqttMessage({
      topic,
      payload,
      qos: 0,
      retain: false
    });
  } catch (error) {
    console.error('❌ Error saving MQTT message to database:', error);
      // Continue processing even if save fails
  }
  
  const topicParts = topic.split('/');
  const baseTopic = topicParts[0]; // First part is usually the device/locker name
  const action = topicParts[1]; // Second part is usually the action (sync, cmd, etc.)
  
  console.log(`📊 Topic parts: [${topicParts.join(', ')}]`);
  
  // Handle heartbeat messages for auto-discovery
  if (payload && payload.type === 'heartbeat' && payload.controllertype === 'locker') {
      try {
    console.log(`💓 Heartbeat received from ${payload.hostname || 'unknown'} (IP: ${payload.ip})`);
        await handleHeartbeat(payload, baseTopic);
      } catch (error) {
        console.error('❌ Error processing heartbeat:', error);
        // Continue to process other message aspects
      }
    }
    
    // Find the lockers associated with this topic (controller)
    let controllerLockers = [];
    try {
      const allLockers = await db.getAllLockers();
      
      // Special handling for command responses on 'lockers/cmd' - these are broadcast responses
      // and should not update any specific locker status
      if (baseTopic === 'lockers' && action === 'cmd') {
        console.log(`📡 Broadcast command response received on ${topic} - not updating any specific locker`);
        // Still emit the message to clients but don't process it for locker updates
      } else {
        controllerLockers = allLockers.filter(l => l.topic === baseTopic || l.locker_id === baseTopic);
      }
    } catch (error) {
      console.error('❌ Error fetching lockers:', error);
      return; // Cannot process further without locker data
    }
  
    if (controllerLockers.length > 0) {
      console.log(`🎯 Processing message for locker: ${controllerLockers[0].name}`);
      
      const targetLocker = controllerLockers[0]; // Use the first matching locker
      
      try {
        await processLockerMessage(targetLocker, action, payload, baseTopic);
      } catch (error) {
        console.error('❌ Error processing locker message:', error);
      }
    } else if (baseTopic !== 'lockers' || action !== 'cmd') {
      // Auto-discovery for new locker (but not for broadcast command responses)
      try {
        await handleNewLockerDiscovery(action, payload, baseTopic, topic, topicParts);
      } catch (error) {
        console.error('❌ Error in auto-discovery:', error);
      }
    }

    // Handle RFID scan messages for auto-assignment - Support multiple message formats
    const isAccessLog = payload && payload.cmd === 'log' && payload.type === 'access' && payload.door;
    const isEventWarning = payload && payload.cmd === 'event' && payload.type === 'WARN' && payload.src === 'rfid' && payload.door;
    
    if (isAccessLog || isEventWarning) {
      // Extract UID from different message formats
      let extractedUid = null;
      
      if (isAccessLog) {
        // Standard access log format: {"cmd":"log","type":"access","uid":"4955cc2951190",...}
        extractedUid = payload.uid;
        console.log(`🔍 Processing ACCESS LOG: uid="${extractedUid}", door="${payload.door}"`);
      } else if (isEventWarning) {
        // Event warning format: {"cmd":"event","type":"WARN","data":"4955cc2951190 MIFARE Ultralight",...}
        // Extract UID from data field (before space)
        if (payload.data && typeof payload.data === 'string') {
          extractedUid = payload.data.split(' ')[0]; // Get UID before space
        }
        console.log(`🔍 Processing EVENT WARNING: extracted uid="${extractedUid}", door="${payload.door}", data="${payload.data}"`);
      }
      
      // Only process messages with valid RFID tags to avoid conflicts
      const isRfidScan = extractedUid && extractedUid.trim() !== '';
      
      if (isRfidScan) {
        console.log(`🔍 RFID scan detected: ${extractedUid} at door ${payload.door}`);
        
        // Use extracted UID for processing (normalize payload)
        payload.uid = extractedUid;
      } else {
        // Skip processing for messages without valid RFID tags
        console.log(`⏭️ Skipping message without valid RFID tag for door ${payload.door}`);
        return;
      }
              try {
          // Find user by RFID tag (uid)
          const allUsers = await db.getAllUsers();
          let user = allUsers.find(u => u.rfid_tag === payload.uid);
        
                  if (!user && isRfidScan && payload.isKnown === 'false' && payload.access === 'Denied') {
            // Auto-create a guest user for unknown tags that were denied access
            console.log(`👤 Creating guest user for unknown RFID tag: ${payload.uid}`);
            user = await db.createUser({
              first_name: 'Guest',
              last_name: 'User',
              email: `guest_${payload.uid}@example.com`,
              rfid_tag: payload.uid,
              role: 'guest'
            });
            
            // Update cache
            usersCache = await db.getAllUsers();
            io.emit('user-created', user);
          }
        
        if (user) {
          // Check if user already has a locker assigned
          if (user.locker_id) {
            // User already has a locker assigned - ALWAYS open assigned locker regardless of scan location
            const allLockers = await db.getAllLockers();
            const assignedLocker = allLockers.find(l => l.id === user.locker_id);
            
            if (assignedLocker) {
              // Check if card was scanned on its own assigned locker (event message with WARN type)
              // payload.door is like "M7-8", assignedLocker.locker_id is like "M7-8-B", assignedLocker.name is like "M7B"
              const isOwnLockerScan = payload.cmd === 'event' && payload.type === 'WARN' && payload.src === 'rfid' &&
                                     (payload.door === assignedLocker.locker_id || 
                                      payload.door === assignedLocker.name ||
                                      assignedLocker.locker_id.startsWith(payload.door + '-') ||
                                      assignedLocker.name.startsWith(payload.door.replace('-', '')));
              
              console.log(`🔍 Own locker detection debug:
                - payload.cmd: "${payload.cmd}"
                - payload.type: "${payload.type}" 
                - payload.src: "${payload.src}"
                - payload.door: "${payload.door}"
                - assignedLocker.locker_id: "${assignedLocker.locker_id}"
                - assignedLocker.name: "${assignedLocker.name}"
                - startsWith check: ${assignedLocker.locker_id.startsWith(payload.door + '-')}
                - isOwnLockerScan: ${isOwnLockerScan}`);
              
              // Always unlock the assigned locker (no group restrictions)
              console.log(`🔓 Unlocking assigned locker ${assignedLocker.name} for user ${user.first_name} ${user.last_name} (card scanned at ${payload.door})`);
              
              if (isOwnLockerScan) {
                console.log(`🎯 Own locker scan detected - applying 1500ms delay`);
              } else {
                console.log(`📡 Remote locker scan - applying 500ms delay`);
              }
              
              // Send unlock command via MQTT with retain flag
              console.log(`🔓 ENTERING RETAINED-UNLOCK DELAY SECTION - mqttClient: ${!!mqttClient}, isConnected: ${isConnected}`);
                  if (mqttClient && isConnected) {
                    const command = {
                      cmd: 'openlock',
                      doorip: assignedLocker.ip_address,
                      lock: assignedLocker.num_locks || 1
                    };
                console.log(`🔓 Retained unlock command for assigned locker ${assignedLocker.name} (${assignedLocker.locker_id})`);
                
                // Determine delay based on scan type
                const delayMs = isOwnLockerScan ? 1500 : 500;
                console.log(`⏰ Starting ${delayMs}ms delay...`);
                    const startTime = Date.now();
                    
                    // Synchronous delay function that actually blocks
                    const sleep = (ms) => {
                      const start = Date.now();
                      console.log(`⏰ Sleep started at ${start}, target: ${start + ms}ms`);
                      while (Date.now() - start < ms) {
                        // Busy wait - this will actually block for the full duration
                      }
                      console.log(`⏰ Sleep ended at ${Date.now()}, actual duration: ${Date.now() - start}ms`);
                    };
                    
                sleep(delayMs); // Variable delay based on scan type
                    const endTime = Date.now();
                    console.log(`⏰ Delay completed after ${endTime - startTime}ms`);
                console.log(`🔓 Publishing RETAINED unlock command...`);
                
                // Publish with retain flag for guaranteed delivery
                mqttClient.publish('lockers/cmd', JSON.stringify(command), { retain: true });
                  }
                  
                  // Log activity
                  await db.logActivity({
                    user_id: user.id,
                    locker_id: assignedLocker.id,
                    action: 'rfid_unlock_assigned',
                    details: { 
                      rfid_tag: payload.uid, 
                      scanning_door: payload.door,
                      assigned_locker: assignedLocker.name,
                      access_granted: true 
                    },
                  });
                  
                  console.log(`✅ RFID unlock successful: ${user.first_name} ${user.last_name} unlocked ${assignedLocker.name}`);
            } else {
              console.log(`❌ Assigned locker not found for user ${user.id}`);
            }
          } else {
            // User not assigned to any locker - proceed with normal assignment logic
            // Find the locker by door name (e.g., "M7-8" should match "M7-8-A" and "M7-8-B")
            const allLockers = await db.getAllLockers();
            const matchingLockers = allLockers.filter(l => {
              // Match exact locker_id or name
              if (l.locker_id === payload.door || l.name === payload.door) {
                return true;
              }
              // Match door pattern (e.g., "M7-8" matches "M7-8-A", "M7-8-B")
              if (l.locker_id && l.locker_id.startsWith(payload.door + '-')) {
                return true;
              }
              // Match name pattern (e.g., "M7-8" matches "M7A", "M7B" if door is "M7-8")
              if (l.name && payload.door.includes('-')) {
                const doorParts = payload.door.split('-');
                const lockerName = l.name;
                // Check if locker name matches the door pattern (e.g., "M7A" for "M7-8")
                if (doorParts.length >= 2) {
                  const baseDoor = doorParts[0]; // "M7"
                  const lockerBase = lockerName.replace(/[AB]$/, ''); // Remove A/B suffix
                  if (lockerBase === baseDoor) {
                    return true;
                  }
                }
              }
              return false;
            });
            
            console.log(`🔍 Found ${matchingLockers.length} matching lockers for door ${payload.door}:`, 
              matchingLockers.map(l => `${l.name} (${l.locker_id})`));
            
            if (matchingLockers.length > 0) {
              // Find an available locker
              const availableLocker = matchingLockers.find(l => l.status === 'available');
              
              if (availableLocker) {
                // Assign locker to user and open it
                const expiryDate = await getLockerExpiryTime();
                await db.updateLocker(availableLocker.id, { 
                  status: 'occupied', 
                  user_id: user.id, 
                  last_used: new Date() 
                });
                await db.updateUser(user.id, { 
                  locker_id: availableLocker.id, 
                  valid_until: expiryDate 
                });
                
                // Send unlock command via MQTT with delay
                console.log(`🔓 ENTERING AUTO-ASSIGN DELAY SECTION - mqttClient: ${!!mqttClient}, isConnected: ${isConnected}`);
                if (mqttClient && isConnected) {
                  const command = {
                    cmd: 'openlock',
                    doorip: availableLocker.ip_address,
                    lock: availableLocker.num_locks || 1
                  };
                  console.log(`🔓 Unlock command sent for locker ${availableLocker.name} (${availableLocker.locker_id})`);
                  console.log(`⏰ Starting 200ms delay...`);
                  const startTime = Date.now();
                  
                  // Synchronous delay function that actually blocks
                  const sleep = (ms) => {
                    const start = Date.now();
                    console.log(`⏰ Sleep started at ${start}, target: ${start + ms}ms`);
                    while (Date.now() - start < ms) {
                      // Busy wait - this will actually block for the full duration
                    }
                    console.log(`⏰ Sleep ended at ${Date.now()}, actual duration: ${Date.now() - start}ms`);
                  };
                  
                  sleep(200); // 200ms delay (consistent with assigned locker logic)
                  const endTime = Date.now();
                  console.log(`⏰ Delay completed after ${endTime - startTime}ms`);
                  mqttClient.publish('lockers/cmd', JSON.stringify(command));
                }
                
                // Skip adduser command - rely only on openlock MQTT commands
                
                // Log activity
                await db.logActivity({
                  user_id: user.id,
                  locker_id: availableLocker.id,
                  action: 'rfid_auto_assign',
                  details: { 
                    rfid_tag: payload.uid, 
                    door: payload.door,
                    assigned_locker: availableLocker.name,
                    access_granted: true 
                  },
                });
                
                // Update caches
                lockersCache = await db.getAllLockers();
                usersCache = await db.getAllUsers();
                
                // Emit updates to frontend
                io.emit('locker-updated', { ...availableLocker, status: 'occupied', user_id: user.id });
                io.emit('user-updated', { ...user, locker_id: availableLocker.id });
                
                console.log(`✅ RFID auto-assignment successful: ${user.first_name} ${user.last_name} assigned to ${availableLocker.name}`);
              } else {
                console.log(`⚠️ No available lockers found for exact door ${payload.door}. Searching for closest available locker...`);
                matchingLockers.forEach(l => console.log(`   - ${l.name} (${l.locker_id}): ${l.status}`));
                
                // Find available locker strictly within the same group
                // First, determine which group the scanned door belongs to
                let scannedLockerGroup = null;
                let anyAvailableLocker = null;
                
                // Find the group of any matching locker
                if (matchingLockers.length > 0) {
                  scannedLockerGroup = await db.getLockerGroup(matchingLockers[0].id);
                  console.log(`🏷️ Scanned locker group:`, scannedLockerGroup?.name || 'No group found');
                  
                  if (scannedLockerGroup) {
                    // Ensure locker_ids is properly populated
                    const lockerIds = scannedLockerGroup.locker_ids || [];
                    console.log(`🔍 Group locker_ids:`, lockerIds);
                    
                    // Get all lockers in the same group
                    const groupLockers = allLockers.filter(l => 
                      lockerIds.includes(l.id)
                    );
                    console.log(`🎯 Searching ${groupLockers.length} lockers in group "${scannedLockerGroup.name}" for availability`);
                    
                    // Find available locker within the same group only
                    anyAvailableLocker = groupLockers.find(l => l.status === 'available');
                    
                    if (anyAvailableLocker) {
                      console.log(`🔄 Found available locker in same group: ${anyAvailableLocker.name} (group: ${scannedLockerGroup.name})`);
                    } else {
                      console.log(`❌ No available lockers found in group "${scannedLockerGroup.name}"`);
                      groupLockers.forEach(l => console.log(`   - ${l.name}: ${l.status}`));
                    }
                  } else {
                    console.log(`❌ No group found for scanned door ${payload.door}, cannot assign`);
                  }
                } else {
                  console.log(`❌ No matching lockers found for door ${payload.door}, cannot determine group`);
                }
                
                if (anyAvailableLocker && scannedLockerGroup) {
                  console.log(`🔄 Assigning available locker in same group: ${anyAvailableLocker.name} (group: ${scannedLockerGroup.name})`);
                  
                  // Assign the closest available locker to user and open it
                  const expiryDate = await getLockerExpiryTime();
                  await db.updateLocker(anyAvailableLocker.id, { 
                    status: 'occupied', 
                    user_id: user.id, 
                    last_used: new Date() 
                  });
                  await db.updateUser(user.id, { 
                    locker_id: anyAvailableLocker.id, 
                    valid_until: expiryDate 
                  });
                  
                  // Send unlock command via MQTT with delay
                  console.log(`🔓 ENTERING CLOSEST-LOCKER DELAY SECTION - mqttClient: ${!!mqttClient}, isConnected: ${isConnected}`);
                  if (mqttClient && isConnected) {
                    const command = {
                      cmd: 'openlock',
                      doorip: anyAvailableLocker.ip_address,
                      lock: anyAvailableLocker.num_locks || 1
                    };
                    console.log(`🔓 Unlock command sent for closest locker ${anyAvailableLocker.name} (${anyAvailableLocker.locker_id})`);
                    console.log(`⏰ Starting 1500ms delay...`);
                    const startTime = Date.now();
                    
                    // Synchronous delay function that actually blocks
                    const sleep = (ms) => {
                      const start = Date.now();
                      console.log(`⏰ Sleep started at ${start}, target: ${start + ms}ms`);
                      while (Date.now() - start < ms) {
                        // Busy wait - this will actually block for the full duration
                      }
                      console.log(`⏰ Sleep ended at ${Date.now()}, actual duration: ${Date.now() - start}ms`);
                    };
                    
                    sleep(1500); // 1500ms delay
                    const endTime = Date.now();
                    console.log(`⏰ Delay completed after ${endTime - startTime}ms`);
                    mqttClient.publish('lockers/cmd', JSON.stringify(command));
                  }
                  
                  // Skip adduser command - rely only on openlock MQTT commands
                  
                  // Update caches
                  lockersCache = await db.getAllLockers();
                  usersCache = await db.getAllUsers();
                  
                  // Log activity
                  await db.logActivity({
                    user_id: user.id,
                    locker_id: anyAvailableLocker.id,
                    action: 'rfid_auto_assign_same_group',
                    details: { 
                      rfid_tag: payload.uid, 
                      scanning_door: payload.door,
                      assigned_locker: anyAvailableLocker.name,
                      group_name: scannedLockerGroup.name,
                      group_id: scannedLockerGroup.id,
                      reason: 'requested_locker_occupied',
                      access_granted: true 
                    },
                  });
                  
                  // Emit events
                  io.emit('locker-updated', await db.getLockerById(anyAvailableLocker.id));
                  io.emit('user-updated', await db.getUserById(user.id));
                  
                  console.log(`✅ Auto-assigned same-group locker: ${user.first_name} ${user.last_name} assigned to ${anyAvailableLocker.name} in group ${scannedLockerGroup.name} (requested ${payload.door})`);
                } else {
                  // Determine specific failure reason
                  let reason = 'unknown';
                  let message = '';
                  
                  if (!scannedLockerGroup) {
                    reason = 'no_group_found';
                    message = `❌ No group found for scanned door ${payload.door}, assignment denied`;
                  } else {
                    reason = 'no_available_lockers_in_group';
                    message = `❌ No available lockers found in group "${scannedLockerGroup.name}"`;
                  }
                  
                  console.log(message);
                  
                  // Log denied access with specific reason
                await db.logActivity({
                  user_id: user.id,
                  action: 'rfid_access_denied',
                  details: { 
                    rfid_tag: payload.uid, 
                    door: payload.door,
                      group_name: scannedLockerGroup?.name || null,
                      group_id: scannedLockerGroup?.id || null,
                      reason: reason,
                      access_granted: false 
                  },
                });
                }
              }
            } else {
              console.log(`❌ No lockers found matching door pattern: ${payload.door}`);
              console.log(`Available lockers:`, allLockers.map(l => `${l.name} (${l.locker_id})`).slice(0, 10));
              
              // Log activity for unknown door
              await db.logActivity({
                user_id: user.id,
                action: 'rfid_unknown_door',
                details: { 
                  rfid_tag: payload.uid, 
                  door: payload.door,
                  access_granted: false 
                },
              });
            }
          }
        } else {
          console.log(`❌ User not found for RFID tag: ${payload.uid}`);
        }
      } catch (error) {
        console.error('❌ Error in automated RFID booking:', error);
      }
    }
  
    // Always try to emit message to connected clients
    try {
      io.emit('mqtt-message', {
        topic,
        payload,
        timestamp: new Date(),
        topicParts,
        baseTopic,
        action
      });
    } catch (error) {
      console.error('❌ Error emitting message to clients:', error);
    }
  } catch (error) {
    console.error('❌ Critical error in MQTT message handler:', error);
    console.error('❌ Topic:', topic);
    console.error('❌ Message:', message.toString());
  }
}

// Helper function to handle heartbeat messages
async function handleHeartbeat(payload, baseTopic) {
  try {
    // Each heartbeat with an IP represents two lockers
    const numLocks = payload.numlocks || 2; // Default to 2 lockers per heartbeat
    
    console.log(`🔍 Processing heartbeat from ${payload.hostname} (${payload.ip}) - ${numLocks} lockers`);
    
    // Check if lockers already exist for this hostname
    const existingLockers = await db.getAllLockers();
    const hostnameParts = payload.hostname.split('-');
    const lockerBaseName = hostnameParts[0]; // e.g., "F1" from "F1-2"
    
    // Find existing lockers for this hostname
    const existingA = existingLockers.find(l => l.locker_id === `${payload.hostname}-A`);
    const existingB = existingLockers.find(l => l.locker_id === `${payload.hostname}-B`);
    
    const lockersToCreate = [];
    const lockersToUpdate = [];
    
    // Handle Locker A (Lock 1)
    if (!existingA) {
      const lockerAData = {
        locker_id: `${payload.hostname}-A`,
        name: parseLockerName(payload.hostname, 1), // e.g., "F1A"
          location: 'Auto-discovered',
          status: 'available',
          ip_address: payload.ip,
          topic: baseTopic,
        num_locks: 1, // Lock number 1
          api_token: payload.api_token,
          controller_type: payload.controllertype,
          uptime: payload.uptime,
          metadata: {
            autoDiscovered: true,
            heartbeatTime: payload.time,
          originalHostname: payload.hostname,
          lockNumber: 1
        }
      };
      lockersToCreate.push(lockerAData);
      } else {
      lockersToUpdate.push({
        locker_id: `${payload.hostname}-A`,
        updates: {
          uptime: payload.uptime,
          ip_address: payload.ip,
          is_online: true,
          last_heartbeat: new Date()
        }
      });
    }
    
    // Handle Locker B (Lock 2) - only if numLocks >= 2
    if (numLocks >= 2) {
      if (!existingB) {
        const lockerBData = {
          locker_id: `${payload.hostname}-B`,
          name: parseLockerName(payload.hostname, 2), // e.g., "F1B"
          location: 'Auto-discovered',
          status: 'available',
          ip_address: payload.ip,
          topic: baseTopic,
          num_locks: 2, // Lock number 2
          api_token: payload.api_token,
          controller_type: payload.controllertype,
          uptime: payload.uptime,
          metadata: {
            autoDiscovered: true,
            heartbeatTime: payload.time,
            originalHostname: payload.hostname,
            lockNumber: 2
          }
        };
        lockersToCreate.push(lockerBData);
      } else {
        lockersToUpdate.push({
          locker_id: `${payload.hostname}-B`,
          updates: {
            uptime: payload.uptime,
            ip_address: payload.ip,
            is_online: true,
            last_heartbeat: new Date()
          }
        });
      }
    }
    
    // Create new lockers
    for (const lockerData of lockersToCreate) {
      const newLocker = await db.createLocker(lockerData);
      console.log(`✅ Auto-created locker from heartbeat: ${newLocker.name} (ID: ${newLocker.id})`);
      io.emit('locker-created', newLocker);
    }
    
    // Update existing lockers
    for (const { locker_id, updates } of lockersToUpdate) {
      const updatedLocker = await db.updateLockerHeartbeat(locker_id, updates);
      console.log(`💓 Updated locker ${locker_id} from heartbeat (uptime: ${updates.uptime}s)`);
        io.emit('locker-updated', updatedLocker);
    }
    
    // Update cache
    lockersCache = await db.getAllLockers();
    
    // Emit heartbeat event for real-time monitoring
    io.emit('heartbeat-received', {
      controllerHostname: payload.hostname,
      controllerIp: payload.ip,
      heartbeat: payload,
      lockersAffected: lockersToCreate.length + lockersToUpdate.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error in handleHeartbeat:', error);
    throw error;
  }
}
  
// Helper function to process locker messages
async function processLockerMessage(targetLocker, action, payload, baseTopic) {
      switch (action) {
        case 'sync':
          // Handshake message - controller is online
          console.log(`🔄 Locker ${baseTopic} handshake received (IP: ${payload.doorip || 'unknown'})`);
          
          const updates = {
            status: 'available',
        is_online: true,
        last_heartbeat: new Date()
          };
          if (payload.doorip) {
            updates.ip_address = payload.doorip;
          }
          
          const updatedLocker = await db.updateLocker(targetLocker.id, updates);
          lockersCache = await db.getAllLockers();
          io.emit('locker-updated', updatedLocker);
          break;
          
        case 'send':
          // Status updates from controller
          console.log(`📤 Status update from locker ${baseTopic}:`, payload);
      
      let statusUpdates = {};
      
      if (payload.cmd === 'openlock') {
        // Lock was opened
        statusUpdates = {
          status: 'available', // Do not set to 'in-use' here
          last_used: new Date()
        };
      } else if (payload.cmd === 'maintenance') {
        // Locker entered maintenance mode
        statusUpdates = { status: 'maintenance' };
      } else if (payload.cmd === 'normal') {
        // Locker returned to normal mode
        statusUpdates = { status: 'available' };
      } else if (payload.cmd === 'log' && payload.type === 'access') {
        // Access log received
        // Handle empty or invalid user_id values
        let userId = null;
        if (payload.uid && payload.uid.trim() !== '' && !isNaN(payload.uid)) {
          userId = parseInt(payload.uid);
        }
        
        await db.logActivity({
          action: 'access_log',
          locker_id: targetLocker.id,
          user_id: userId,
          details: {
            isKnown: payload.isKnown,
            access: payload.access,
            username: payload.username,
            time: new Date(payload.time * 1000) // Convert Unix timestamp to Date
          }
        });
      }
      
      if (Object.keys(statusUpdates).length > 0) {
        const statusUpdate = await db.updateLocker(targetLocker.id, statusUpdates);
            lockersCache = await db.getAllLockers();
            io.emit('locker-updated', statusUpdate);
          }
          break;
          
        case 'cmd':
          // Command responses
          console.log(`⚡ Command response from ${targetLocker.name}:`, payload);
      let cmdStatusUpdates = {};
          
          if (payload.cmd === 'openlock') {
        cmdStatusUpdates = {
              status: 'available', // Do not set to 'in-use' here
              last_used: new Date()
            };
          } else if (payload.cmd === 'maintenance') {
        cmdStatusUpdates = { status: 'maintenance' };
          } else if (payload.cmd === 'normal') {
        cmdStatusUpdates = { status: 'available' };
          }
          
      if (Object.keys(cmdStatusUpdates).length > 0) {
        const cmdUpdatedLocker = await db.updateLocker(targetLocker.id, cmdStatusUpdates);
            lockersCache = await db.getAllLockers();
            io.emit('locker-updated', cmdUpdatedLocker);
          }
          break;
          
        default:
          console.log(`❓ Unknown action '${action}' from locker ${baseTopic}:`, payload);
          break;
      }
    }

// Helper function to handle new locker discovery
async function handleNewLockerDiscovery(action, payload, baseTopic, topic, topicParts) {
    // Auto-discovery: Create new locker if handshake received from unknown device
    if (action === 'sync' && payload && payload.doorip) {
      console.log(`🔍 Auto-discovery: New locker detected on topic '${baseTopic}' with IP ${payload.doorip}`);
      
        // Create new locker automatically with proper naming
        const lockerTitle = parseLockerName(baseTopic, payload.lock || 1);
        
        const lockerData = {
          locker_id: baseTopic,
          name: lockerTitle,
          status: 'available',
          location: 'Auto-discovered',
          ip_address: payload.doorip,
          topic: baseTopic,
          num_locks: payload.lock || 1,
          metadata: {
            autoDiscovered: true,
            originalHostname: baseTopic
          }
        };
        
        const newLocker = await db.createLocker(lockerData);
        
        // Update cache
        lockersCache = await db.getAllLockers();
        
        console.log(`✅ Auto-created locker: ${newLocker.name} (ID: ${newLocker.id})`);
        io.emit('locker-created', newLocker);
    } else {
      // Log message for unknown topic
      console.log(`📝 Message logged for unknown topic: ${topic}`);
      console.log(`📄 Full topic breakdown: Base='${baseTopic}', Action='${action}', Parts=[${topicParts.join(', ')}]`);
    }
  }
  
// Function to check and mark offline lockers
async function checkOfflineLockers() {
  try {
    const lockers = await db.getAllLockers();
    const fiveMinutesAgo = new Date(Date.now() - OFFLINE_CHECK_INTERVAL);
    const offlineLockers = [];
    
    for (const locker of lockers) {
      if (locker.is_online && locker.last_heartbeat) {
        const lastHeartbeat = new Date(locker.last_heartbeat);
        if (lastHeartbeat < fiveMinutesAgo) {
          // Mark locker as offline
          await db.updateLocker(locker.id, { is_online: false });
          offlineLockers.push(locker.name);
        }
      }
    }
    
    if (offlineLockers.length > 0) {
      console.log(`📴 Marked ${offlineLockers.length} lockers as offline: ${offlineLockers.join(', ')}`);
      // Update cache and emit updates
      lockersCache = await db.getAllLockers();
      io.emit('lockers-offline', { count: offlineLockers.length, lockers: offlineLockers });
    }
  } catch (error) {
    console.error('❌ Error checking offline lockers:', error);
  }
}

// Helper function to parse locker names from dash-separated hostnames
function parseLockerName(lockerHostname, lockNumber) {
  // Hostnames are always separated by "-"
  // Format: {locker_name}-{numlock}
  // Example: F1-2 means locker name "F1" with numlock "2"
  
  const parts = lockerHostname.split('-');
  if (parts.length >= 2) {
    const lockerName = parts[0]; // e.g., "F1"
    const numlock = parts[1];    // e.g., "2"
    
    // For specific lock numbers, append A/B designation
    if (lockNumber === 1 || lockNumber === 'A') {
      return `${lockerName}A`; // e.g., "F1A"
    } else if (lockNumber === 2 || lockNumber === 'B') {
      return `${lockerName}B`; // e.g., "F1B"
    }
    
    // Default: return locker name with lock number
    return `${lockerName}-${lockNumber}`;
  }
  
  // Fallback: return the hostname as is
  return lockerHostname;
}

// Note: updateLockerStatusFromUsers function removed as it was unused and could cause errors

// API Routes
app.get('/api/lockers', async (req, res) => {
  try {
    const lockers = await db.getAllLockers();
    lockersCache = lockers; // Update cache
    res.json(lockers);
  } catch (error) {
    console.error('❌ Error fetching lockers:', error);
    res.status(500).json({ error: 'Failed to fetch lockers' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    usersCache = users; // Update cache
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { first_name, last_name, email, gym_id, phone, role } = req.body;
    
    const userData = {
      first_name,
      last_name,
      email,
      gym_id,
      phone,
      role: role || 'user',
      created_at: new Date()
    };
    
    const newUser = await db.createUser(userData);
    
    // Update cache
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      action: 'user_created',
      user_id: newUser.id,
      details: { first_name, last_name, email },
      ip_address: req.ip
    });
    
    io.emit('user-created', newUser);
    res.json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedUser = await db.updateUser(id, updates);
    if (updatedUser) {
      // Update cache
      usersCache = await db.getAllUsers();
      
      // Log activity
      await db.logActivity({
        action: 'user_updated',
        user_id: id,
        details: updates,
        ip_address: req.ip
      });
      
      io.emit('user-updated', updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has assigned locker
    const user = await db.getUserById(id);
    if (user && user.locker_id) {
      return res.status(400).json({ error: 'Cannot delete user with assigned locker. Please unassign the locker first.' });
    }
    
    const deleted = await db.deleteUser(id);
    if (deleted) {
      // Update cache
      usersCache = await db.getAllUsers();
      
      // Log activity
      await db.logActivity({
        action: 'user_deleted',
        user_id: id,
        details: { user_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown' },
        ip_address: req.ip
      });
      
      io.emit('user-deleted', { id });
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user logs
app.get('/api/users/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await db.getUserLogs(id);
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching user logs:', error);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
});

// Heartbeat monitoring dashboard
app.get('/api/heartbeat-status', async (req, res) => {
  try {
    const lockers = await db.getAllLockers();
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - OFFLINE_CHECK_INTERVAL);
    
    const stats = {
      total: lockers.length,
      online: 0,
      offline: 0,
      noHeartbeat: 0,
      averageUptime: 0,
      lastHeartbeat: null,
      lockersByStatus: {
        online: [],
        offline: [],
        noHeartbeat: []
      }
    };
    
    let totalUptime = 0;
    let uptimeCount = 0;
    let latestHeartbeat = null;
    
    for (const locker of lockers) {
      const isOnline = locker.is_online && locker.last_heartbeat && 
                      new Date(locker.last_heartbeat) > fiveMinutesAgo;
      
      if (isOnline) {
        stats.online++;
        stats.lockersByStatus.online.push({
          id: locker.id,
          name: locker.name,
          lastHeartbeat: locker.last_heartbeat,
          uptime: locker.uptime
        });
      } else if (locker.last_heartbeat) {
        stats.offline++;
        stats.lockersByStatus.offline.push({
          id: locker.id,
          name: locker.name,
          lastHeartbeat: locker.last_heartbeat,
          uptime: locker.uptime
        });
      } else {
        stats.noHeartbeat++;
        stats.lockersByStatus.noHeartbeat.push({
          id: locker.id,
          name: locker.name
        });
      }
      
      if (locker.uptime && locker.uptime > 0) {
        totalUptime += locker.uptime;
        uptimeCount++;
      }
      
      if (locker.last_heartbeat) {
        const heartbeatTime = new Date(locker.last_heartbeat);
        if (!latestHeartbeat || heartbeatTime > latestHeartbeat) {
          latestHeartbeat = heartbeatTime;
        }
      }
    }
    
    stats.averageUptime = uptimeCount > 0 ? Math.round(totalUptime / uptimeCount) : 0;
    stats.lastHeartbeat = latestHeartbeat;
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching heartbeat status:', error);
    res.status(500).json({ error: 'Failed to fetch heartbeat status' });
  }
});

app.post('/api/lockers', async (req, res) => {
  try {
    const { name, location, doorip, mqttTopic, lockNumber } = req.body;
    const lockerData = {
      locker_id: `locker-${Date.now()}`,
      name,
      location,
      status: 'available',
      ip_address: doorip || '192.168.1.100',
      topic: mqttTopic || 'rfid',
      num_locks: lockNumber || 1
    };
    
    const newLocker = await db.createLocker(lockerData);
    
    // Subscribe to new locker's MQTT topics
    if (mqttClient && mqttClient.connected) {
      mqttClient.subscribe(`${newLocker.topic}/sync`);
      mqttClient.subscribe(`${newLocker.topic}/send`);
      mqttClient.subscribe(`${newLocker.topic}/accesslist`);
      mqttClient.subscribe(`${newLocker.topic}/cmd`);
    }
    
    // Update cache
    lockersCache = await db.getAllLockers();
    
    // Log activity
    await db.logActivity({
      action: 'locker_created',
      locker_id: newLocker.id,
      details: { name, location },
      ip_address: req.ip
    });
    
    io.emit('locker-created', newLocker);
    res.json(newLocker);
  } catch (error) {
    console.error('❌ Error creating locker:', error);
    res.status(500).json({ error: 'Failed to create locker' });
  }
});

app.put('/api/lockers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedLocker = await db.updateLocker(id, updates);
    if (updatedLocker) {
      // Update cache
      lockersCache = await db.getAllLockers();
      
      // Log activity
      await db.logActivity({
        action: 'locker_updated',
        locker_id: id,
        details: updates,
        ip_address: req.ip
      });
      
      io.emit('locker-updated', updatedLocker);
      res.json(updatedLocker);
    } else {
      res.status(404).json({ error: 'Locker not found' });
    }
  } catch (error) {
    console.error('❌ Error updating locker:', error);
    res.status(500).json({ error: 'Failed to update locker' });
  }
  });

// Clear all lockers and wait for new heartbeats
app.delete('/api/lockers/clear', async (req, res) => {
  try {
    console.log('🔍 Starting clear lockers operation...');
    
    // Get current lockers for logging
    console.log('1️⃣ Fetching current lockers...');
    const currentLockers = await db.getAllLockers();
    console.log(`   Found ${currentLockers.length} lockers`);
    
    if (currentLockers.length === 0) {
      console.log('ℹ️ No lockers to clear');
      return res.json({ success: true, message: 'No lockers to clear', cleared: 0 });
    }
    
    // Use a transaction for the entire operation
    console.log('2️⃣ Starting database transaction...');
    await db.transaction(async (client) => {
      // Clear all MQTT messages
      console.log('3️⃣ Clearing MQTT messages...');
      await client.query('DELETE FROM mqtt_messages');
      
      // Clear all activity logs
      console.log('4️⃣ Clearing activity logs...');
      await client.query('DELETE FROM activity_logs');
      
      // Clear all group_lockers
      console.log('5️⃣ Clearing group_lockers...');
      await client.query('DELETE FROM group_lockers');
      
      // Clear all lockers
      console.log('6️⃣ Clearing lockers...');
      await client.query('DELETE FROM lockers');
    });
    
    // Update cache
    lockersCache = [];
    
    // Log activity
    await db.logActivity({
      action: 'clear_lockers',
      details: { cleared: currentLockers.length }
    });
    
    // Emit event to connected clients
    io.emit('lockers-cleared', { cleared: currentLockers.length });
    
    // Send response
    res.json({
      success: true,
      message: `Successfully cleared ${currentLockers.length} lockers`,
      cleared: currentLockers.length
    });
  } catch (error) {
    console.error('❌ Error clearing lockers:', error);
    res.status(500).json({ error: 'Failed to clear lockers' });
  }
});

app.delete('/api/lockers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLocker = await db.deleteLocker(id);
    
    if (deletedLocker) {
      // Update cache
      lockersCache = await db.getAllLockers();
      
      // Log activity
      await db.logActivity({
        action: 'locker_deleted',
        locker_id: id,
        details: { name: deletedLocker.name },
        ip_address: req.ip
      });
      
      io.emit('locker-deleted', deletedLocker);
      res.json({ message: 'Locker deleted successfully' });
    } else {
      res.status(404).json({ error: 'Locker not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting locker:', error);
    res.status(500).json({ error: 'Failed to delete locker' });
  }
});

// User management with phone numbers
app.post('/api/users', async (req, res) => {
  try {
    const { name, phone, uid, membershipType, email } = req.body;
    const userData = {
      username: name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@gym.local`,
      password_hash: 'default_hash', // In production, implement proper password hashing
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
      phone,
      role: membershipType || 'user'
    };
    
    const newUser = await db.createUser(userData);
    
    // Update cache
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      action: 'user_created',
      user_id: newUser.id,
      details: { name, phone, membershipType },
      ip_address: req.ip
    });
    
    io.emit('user-added', newUser);
    res.json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedUser = await db.updateUser(id, updates);
    if (updatedUser) {
      // Update cache
      usersCache = await db.getAllUsers();
      
      // Log activity
      await db.logActivity({
        action: 'user_updated',
        user_id: id,
        details: updates,
        ip_address: req.ip
      });
      
      io.emit('user-updated', updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await db.deleteUser(id);
    
    if (deletedUser) {
      // Update cache
      usersCache = await db.getAllUsers();
      
      // Log activity
      await db.logActivity({
        action: 'user_deleted',
        user_id: id,
        details: { username: deletedUser.username },
        ip_address: req.ip
      });
      
      io.emit('user-deleted', deletedUser);
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Extend user's locker expiry time
app.put('/api/users/:id/extend-expiry', async (req, res) => {
  try {
    const { id } = req.params;
    const { newExpiryDate } = req.body;
    
    const allUsers = await db.getAllUsers();
    const user = allUsers.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.locker_id) {
      return res.status(400).json({ error: 'User does not have an assigned locker' });
    }
    
    // Update user's valid_until time
    const updatedUser = await db.updateUser(id, {
      valid_until: new Date(newExpiryDate)
    });
    
    // Update cache
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      action: 'extend_expiry',
      user_id: id,
      locker_id: user.locker_id,
      details: { 
        previousExpiry: user.valid_until,
        newExpiry: newExpiryDate,
        userId: id,
        lockerId: user.locker_id
      },
      ip_address: req.ip
    });
    
    // Send updated MQTT command with new expiry time
    if (mqttClient && isConnected && user.locker_id) {
      const allLockers = await db.getAllLockers();
      const locker = allLockers.find(l => l.id === user.locker_id);
      
      if (locker) {
        const command = {
          cmd: "adduser",
          user: user.username || user.email,
          validuntil: Math.floor(new Date(newExpiryDate).getTime() / 1000),
          uid: user.id,
          doorip: locker.ip_address
        };
        
        mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
        console.log(`📡 Updated locker expiry via MQTT: ${JSON.stringify(command)}`);
      }
    }
    
    io.emit('user-updated', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Error extending user expiry:', error);
    res.status(500).json({ error: 'Failed to extend expiry time' });
  }
});

// Locker assignment with expiry date
app.post('/api/lockers/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, expiryDate } = req.body;
    
    const allLockers = await db.getAllLockers();
    const allUsers = await db.getAllUsers();
    
    const locker = allLockers.find(l => l.id === parseInt(id));
    const user = allUsers.find(u => u.id === userId);
    
    if (!locker || !user) {
      return res.status(404).json({ error: 'Locker or user not found' });
    }
    
    if (locker.status !== 'available') {
      return res.status(400).json({ error: 'Locker is not available' });
    }
    
    // Calculate expiry date - use provided or get from settings
    let finalExpiryDate;
    if (expiryDate) {
      finalExpiryDate = new Date(expiryDate);
    } else {
      finalExpiryDate = await getLockerExpiryTime();
      console.log(`🕐 Using automatic expiry time: ${finalExpiryDate.toISOString()}`);
    }
    
    // Update locker
    const lockerUpdates = {
      status: 'occupied',
      user_id: userId,
      last_used: new Date()
    };
    
    const updatedLocker = await db.updateLocker(id, lockerUpdates);
    
    // Update user
    const userUpdates = {
      locker_id: id,
      valid_until: finalExpiryDate
    };
    
    const updatedUser = await db.updateUser(userId, userUpdates);
    
    // Update caches
    lockersCache = await db.getAllLockers();
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      user_id: userId,
      locker_id: id,
      action: 'assign_locker',
      details: { lockerId: id, userId, expiryDate: finalExpiryDate.toISOString() }
    });
    
    // Send MQTT command to add user to locker
    if (mqttClient && isConnected) {
      const command = {
        cmd: "adduser",
        user: user.username,
        validuntil: Math.floor(finalExpiryDate.getTime() / 1000),
        uid: user.id,
        doorip: locker.ip_address
      };
      
      mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
      console.log(`📡 Sent assignment command with expiry: ${JSON.stringify(command)}`);
    }
    
    io.emit('locker-updated', updatedLocker);
    io.emit('user-updated', updatedUser);
    res.json({ locker: updatedLocker, user: updatedUser });
  } catch (error) {
    console.error('❌ Error assigning locker:', error);
    res.status(500).json({ error: 'Failed to assign locker' });
  }
});

// Unassign locker
app.post('/api/lockers/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;
    
    const allLockers = await db.getAllLockers();
    const locker = allLockers.find(l => l.id === parseInt(id));
    
    if (!locker) {
      return res.status(404).json({ error: 'Locker not found' });
    }
    
    let user = null;
    if (locker.user_id) {
      const allUsers = await db.getAllUsers();
      user = allUsers.find(u => u.id === locker.user_id);
      
      if (user) {
        // Update user
        const updatedUser = await db.updateUser(locker.user_id, {
          locker_id: null,
          valid_until: null
        });
        
        io.emit('user-updated', updatedUser);
      }
      
      // Send MQTT command to remove user from locker
      if (mqttClient && isConnected && user) {
        const command = {
          cmd: "deluser",
          doorip: locker.ip_address,
          uid: user.id
        };
        
        mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
      }
    }
    
    // Update locker
    const updatedLocker = await db.updateLocker(id, {
      status: 'available',
      user_id: null
    });
    
    // Update caches
    lockersCache = await db.getAllLockers();
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      user_id: user ? user.id : null,
      locker_id: id,
      action: 'unassign_locker',
      details: { lockerId: id, userId: user ? user.id : null }
    });
    
    io.emit('locker-updated', updatedLocker);
    res.json(updatedLocker);
  } catch (error) {
    console.error('❌ Error unassigning locker:', error);
    res.status(500).json({ error: 'Failed to unassign locker' });
  }
});

// Send command to locker
app.post('/api/lockers/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body;
    
    const locker = await db.getLockerById(id);
    if (!locker) {
      return res.status(404).json({ error: 'Locker not found' });
    }
    
    // Only send MQTT commands for non-maintenance commands
    if (command !== 'maintenance' && command !== 'normal') {
      // Send command via MQTT
    if (mqttClient && isConnected) {
      const mqttCommand = {
        cmd: command,
          doorip: locker.ip_address,
          lock: locker.num_locks || 1
        };
        
        // Use the correct topic structure for Rubik lockers
        const topic = 'lockers/cmd';
        mqttClient.publish(topic, JSON.stringify(mqttCommand));
        
        console.log(`⚡ Command sent to ${locker.name} (${topic}):`, mqttCommand);
          
          // Log activity
          await db.logActivity({
            action: 'send_command',
          locker_id: id,
          details: { command: mqttCommand, topic }
      });
    } else {
        throw new Error('MQTT not connected');
      }
    }
    
    // For maintenance/normal commands, only update the database status
    if (command === 'maintenance' || command === 'normal') {
      const statusUpdate = {
        status: command === 'maintenance' ? 'maintenance' : 'available'
      };
      
      const updatedLocker = await db.updateLocker(id, statusUpdate);
      
      // Log activity
      await db.logActivity({
        action: 'locker_maintenance',
        locker_id: id,
        details: { 
          command, 
          previousStatus: locker.status,
          newStatus: statusUpdate.status 
        },
        ip_address: req.ip
      });
      
      // Update cache
      lockersCache = await db.getAllLockers();
      
      // Emit update to clients
      io.emit('locker-updated', updatedLocker);
      
      console.log(`🔧 Locker ${locker.name} set to ${statusUpdate.status} (system-only)`);
    }
          
    res.json({ success: true, message: 'Command processed successfully' });
  } catch (error) {
    console.error('❌ Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command' });
  }
});

// Bulk unlock all lockers
app.post('/api/lockers/bulk-unlock', async (req, res) => {
  try {
    const { onlineOnly = true } = req.body;
    const allLockers = await db.getAllLockers();
    
    // Filter lockers based on online status if requested
    const targetLockers = onlineOnly 
      ? allLockers.filter(locker => {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          return locker.last_heartbeat && new Date(locker.last_heartbeat) > fiveMinutesAgo;
        })
      : allLockers;
    
    const results = [];
    const errors = [];

    // Process each locker
    for (const locker of targetLockers) {
      try {
        // Send unlock command via MQTT
        if (mqttClient && isConnected) {
          const command = {
            cmd: 'openlock',
            doorip: locker.ip_address,
            lock: locker.num_locks || 1
          };
          
          // Use the correct topic structure for Rubik lockers
          const topic = 'lockers/cmd';
          mqttClient.publish(topic, JSON.stringify(command));
          
          console.log(`⚡ Command sent to ${locker.name} (${topic}):`, command);
    
    // Log activity
    await db.logActivity({
            action: 'send_command',
            locker_id: locker.id,
            details: { command, topic }
});

          results.push({ locker: locker.name, success: true });
        } else {
          throw new Error('MQTT not connected');
      }
  } catch (error) {
        console.error(`❌ Error unlocking ${locker.name}:`, error);
        errors.push({ locker: locker.name, error: error.message });
    }
    }
    
    // Send response with results
    res.json({
      success: true,
      results,
      errors
    });
  } catch (error) {
    console.error('❌ Error in bulk unlock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Locker Groups API Endpoints
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await db.getAllGroups();
    const allLockers = await db.getAllLockers();
    
    // Enhance groups with locker availability information
    const enhancedGroups = groups.map(group => {
      const groupLockers = allLockers.filter(locker => 
        group.locker_ids.includes(locker.id)
      );
      
      const availableLockers = groupLockers.filter(l => l.status === 'available');
      const occupiedLockers = groupLockers.filter(l => l.status === 'occupied');
      
      return {
        ...group,
        lockers: groupLockers,
        available: availableLockers.length,
        occupied: occupiedLockers.length,
        total: groupLockers.length
      };
    });
    
    res.json(enhancedGroups);
  } catch (error) {
    console.error('❌ Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group by ID
app.get('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.getGroupById(id);
    if (group) {
      const allLockers = await db.getAllLockers();
      const groupLockers = allLockers.filter(locker => 
        group.locker_ids.includes(locker.id)
      );
      
      const availableLockers = groupLockers.filter(l => l.status === 'available');
      const occupiedLockers = groupLockers.filter(l => l.status === 'occupied');
      
      const enhancedGroup = {
        ...group,
        lockers: groupLockers,
        available: availableLockers.length,
        occupied: occupiedLockers.length,
        total: groupLockers.length
      };
      
      res.json(enhancedGroup);
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

app.get('/api/locker-groups', async (req, res) => {
  try {
    const groups = await db.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error('❌ Error fetching locker groups:', error);
    res.status(500).json({ error: 'Failed to fetch locker groups' });
  }
});

app.get('/api/locker-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.getGroupById(id);
    if (group) {
      res.json(group);
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching locker group:', error);
    res.status(500).json({ error: 'Failed to fetch locker group' });
  }
});

app.post('/api/locker-groups', async (req, res) => {
  try {
    const groupData = req.body;
    console.log('🔧 Creating group with data:', groupData);
    
    const newGroup = await db.createGroup(groupData);
    console.log('✅ Group created:', newGroup);
    
    if (!newGroup) {
      console.error('❌ createGroup returned null/undefined');
      return res.status(500).json({ error: 'Failed to create group - no data returned' });
    }
    
    // Log activity
    await db.logActivity({
      action: 'group_created',
      details: { group: newGroup },
      ip_address: req.ip
    });
    
    io.emit('locker-group-added', newGroup);
    res.json(newGroup);
  } catch (error) {
    console.error('❌ Error creating locker group:', error);
    res.status(500).json({ error: 'Failed to create locker group', details: error.message });
  }
});

app.put('/api/locker-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedGroup = await db.updateGroup(id, updates);
    if (updatedGroup) {
    // Log activity
    await db.logActivity({
        action: 'group_updated',
        details: { group: updatedGroup, updates },
        ip_address: req.ip
    });
    
    io.emit('locker-group-updated', updatedGroup);
    res.json(updatedGroup);
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    console.error('❌ Error updating locker group:', error);
    res.status(500).json({ error: 'Failed to update locker group' });
  }
});

app.delete('/api/locker-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGroup = await db.deleteGroup(id);
    
    if (deletedGroup) {
    // Log activity
    await db.logActivity({
        action: 'group_deleted',
        details: { group: deletedGroup },
        ip_address: req.ip
    });
    
    io.emit('locker-group-deleted', deletedGroup);
      res.json({ message: 'Group deleted successfully' });
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting locker group:', error);
    res.status(500).json({ error: 'Failed to delete locker group' });
  }
});

// Bulk operations for locker groups
app.post('/api/locker-groups/:id/bulk-unlock', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await db.getGroupById(id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const results = [];
    const errors = [];
    
    // Get all lockers in the group
    const lockers = await Promise.all(
      group.locker_ids.map(lockerId => db.getLockerById(lockerId))
    );
    
    // Send unlock command to each locker
    for (const locker of lockers) {
      if (!locker) continue;
      
      try {
        if (mqttClient && isConnected) {
          const command = {
            cmd: 'openlock',
            doorip: locker.ip_address,
            lock: locker.num_locks || 1
          };
          
          mqttClient.publish('lockers/cmd', JSON.stringify(command));
          
          // Do not update locker status to 'in-use' here
          results.push({
            lockerId: locker.id,
            lockerName: locker.name,
            success: true
          });
          
          io.emit('locker-updated', locker); // Optionally emit current locker state
        } else {
          throw new Error('MQTT not connected');
        }
      } catch (error) {
        errors.push({ 
          lockerId: locker.id,
          lockerName: locker.name,
          error: error.message 
        });
      }
    }
    
    // Log activity
    await db.logActivity({
      action: 'bulk_unlock',
      details: {
        groupId: id,
        groupName: group.name,
        results,
        errors
      },
      ip_address: req.ip
    });
    
    // Emit bulk operation result
    io.emit('bulk-operation-completed', {
      operation: 'unlock',
      groupId: id,
      groupName: group.name,
      results,
      errors
    });
    
    res.json({ results, errors });
  } catch (error) {
    console.error('❌ Error performing bulk unlock:', error);
    res.status(500).json({ error: 'Failed to perform bulk unlock' });
  }
});

app.post('/api/locker-groups/:id/bulk-maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const { enable } = req.body;
    const group = await db.getGroupById(id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const results = [];
    const errors = [];
    
    // Get all lockers in the group
    const lockers = await Promise.all(
      group.locker_ids.map(lockerId => db.getLockerById(lockerId))
    );
    
    // Update maintenance status for each locker (system-only, no MQTT)
    for (const locker of lockers) {
      if (!locker) continue;
      
      try {
        // Update locker status in database only
        const updatedLocker = await db.updateLocker(locker.id, {
          status: enable ? 'maintenance' : 'available'
        });
          
          results.push({
          lockerId: locker.id,
            lockerName: locker.name,
          success: true
        });
        
        io.emit('locker-updated', updatedLocker);
      } catch (error) {
        errors.push({ 
          lockerId: locker.id,
          lockerName: locker.name,
          error: error.message 
        });
      }
    }
    
    // Update cache
    lockersCache = await db.getAllLockers();
    
    // Log activity
    await db.logActivity({
      action: enable ? 'bulk_maintenance_enable' : 'bulk_maintenance_disable',
      details: {
        groupId: id,
        groupName: group.name,
        results,
        errors
      },
      ip_address: req.ip
    });
    
    // Emit bulk operation result
    io.emit('bulk-operation-completed', {
      operation: enable ? 'maintenance' : 'normal',
      groupId: id,
      groupName: group.name,
      results,
      errors
    });
    
    res.json({ results, errors });
  } catch (error) {
    console.error('❌ Error performing bulk maintenance:', error);
    res.status(500).json({ error: 'Failed to perform bulk maintenance' });
  }
});

// Serve React app for all other routes (disabled for development)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });

// Ensure we always use port 3001, regardless of environment variables
const PORT = 3001;

// Function to start server with proper error handling
async function startServer() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await db.connect();
    console.log('✅ Database connected successfully');
    
    // Load initial data
    console.log('📊 Loading initial data...');
    lockersCache = await db.getAllLockers();
    usersCache = await db.getAllUsers();
    groupsCache = await db.getAllGroups();
    console.log(`📦 Loaded ${lockersCache.length} lockers, ${usersCache.length} users, ${groupsCache.length} groups`);
    
    // Load system settings
    try {
      const settings = await db.getAllSettings();
      console.log('📋 Found settings in database:', settings.length);
      
      if (settings.length > 0) {
        settings.forEach(setting => {
          console.log(`🔧 Loading setting: ${setting.key}`);
          if (setting.key === 'mqttConfig' && setting.value) {
            systemSettings.mqttConfig = { ...systemSettings.mqttConfig, ...setting.value };
            console.log('✅ MQTT config loaded:', systemSettings.mqttConfig);
          } else if (setting.key === 'notifications' && setting.value) {
            systemSettings.notifications = setting.value;
          } else if (setting.key === 'systemSettings' && setting.value) {
            systemSettings.systemSettings = { ...systemSettings.systemSettings, ...setting.value };
          }
        });
      }
      console.log('⚙️  System settings loaded from database');
      console.log('🔌 Current MQTT config:', systemSettings.mqttConfig);
    } catch (error) {
      console.log('⚠️  Using default system settings (database settings not found):', error.message);
      console.log('🔌 Default MQTT config:', systemSettings.mqttConfig);
    }
    
    // Create HTTP server
    server = http.createServer(app);
    
    // Initialize Socket.IO with CORS
    io = socketIo(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
        transports: ['websocket']
      },
      pingTimeout: 20000,
      pingInterval: 10000
    });

    // Set up Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('👤 Client connected:', socket.id);
      
      socket.on('test-message', (data) => {
        console.log('🧪 Received test message from client:', data);
        socket.emit('test-response', { 
          message: 'Test response from server!', 
          timestamp: new Date().toISOString(),
          clientId: socket.id 
        });
      });
      
      socket.on('disconnect', () => {
        console.log('👋 Client disconnected:', socket.id);
      });
    });
    
    // Start server
    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        console.log('✅ Server successfully started on port', PORT);
        console.log('🌐 Server URL: http://localhost:' + PORT);
        resolve();
      });
    
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log('❌ Port', PORT, 'is already in use!');
          reject(new Error(`Port ${PORT} is already in use`));
      } else {
          console.error('❌ Server error:', error);
          reject(error);
        }
      });
    });
    
    // Connect to MQTT broker
    connectMQTT();
    
    // Start offline detection interval
    offlineCheckInterval = setInterval(checkOfflineLockers, OFFLINE_CHECK_INTERVAL);
    console.log('⏰ Started offline detection (checking every 5 minutes)');
    
    // Start locker expiry check interval
    expiryCheckInterval = setInterval(checkExpiredLockers, EXPIRY_CHECK_INTERVAL);
    console.log('⏰ Started locker expiry check (checking every 10 minutes)');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Signal handlers for graceful shutdown
// Global shutdown flag
let isShuttingDown = false;

const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2', 'SIGBREAK'];

signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`🛑 Received ${signal}, shutting down gracefully...`);
    
    // Prevent multiple cleanup attempts
    if (isShuttingDown) {
      console.log('⚠️ Shutdown already in progress...');
      return;
    }
    
    isShuttingDown = true;
    
    try {
      await cleanup();
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      process.exit(1);
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  try {
    await cleanup();
  } catch (cleanupError) {
    console.error('❌ Error during cleanup after uncaught exception:', cleanupError);
  } finally {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  try {
    await cleanup();
  } catch (cleanupError) {
    console.error('❌ Error during cleanup after unhandled rejection:', cleanupError);
  } finally {
    process.exit(1);
  }
});

// Start server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Cleanup function
async function cleanup() {
  console.log('🧹 Cleaning up resources...');
  isShuttingDown = true; // Set the flag

  // Clear offline detection interval
  if (offlineCheckInterval) {
    clearInterval(offlineCheckInterval);
    offlineCheckInterval = null;
    console.log('⏰ Stopped offline detection interval');
  }
  
  // Clear expiry check interval
  if (expiryCheckInterval) {
    clearInterval(expiryCheckInterval);
    expiryCheckInterval = null;
    console.log('⏰ Stopped locker expiry check interval');
  }

  // Track cleanup status
  let mqttClosed = false;
  let dbClosed = false;
  let serverClosed = false;

  try {
    // Close MQTT connection with timeout
    if (mqttClient) {
      console.log('🔌 Closing MQTT connection...');
      try {
        isConnected = false;
        isConnecting = false;
        mqttClient.removeAllListeners();
        await Promise.race([
          new Promise((resolve, reject) => {
            mqttClient.end(true, {}, () => {
              console.log('✅ MQTT connection closed gracefully');
              resolve();
            });
            mqttClient.once('close', () => {
              console.log('✅ MQTT connection closed via event');
              resolve();
            });
            mqttClient.once('error', (err) => {
              console.error('⚠️ MQTT error during shutdown:', err);
              reject(err);
            });
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MQTT shutdown timeout')), 5000)
          )
        ]).catch(error => {
          console.error('⚠️ Error during MQTT shutdown:', error);
          try {
            mqttClient.removeAllListeners();
            mqttClient.end(true);
          } catch (e) {
            console.error('⚠️ Error force closing MQTT:', e);
          }
        });
        mqttClient = null;
        mqttClosed = true;
      } catch (error) {
        console.error('⚠️ Error closing MQTT connection:', error);
      }
    } else {
      mqttClosed = true;
    }

    // 1. Close HTTP server first
    if (server) {
      console.log('🖥️  Closing HTTP server...');
      try {
        await Promise.race([
          new Promise((resolve, reject) => {
            server.close((err) => {
              if (err) {
                console.error('⚠️ Error closing server:', err);
                reject(err);
              } else {
                console.log('✅ Server closed successfully');
                resolve();
              }
            });
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Server shutdown timeout')), 5000)
          )
        ]).catch(error => {
          console.error('⚠️ Error during server shutdown:', error);
        });
        serverClosed = true;
      } catch (error) {
        console.error('⚠️ Error closing server:', error);
      }
    } else {
      serverClosed = true;
    }

    // 2. Now close the database connection
    if (db) {
      console.log('🗄️  Closing database connection...');
      try {
        await Promise.race([
          db.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database shutdown timeout')), 5000)
          )
        ]).catch(error => {
          console.error('⚠️ Error during database shutdown:', error);
        });
        console.log('✅ Database connection closed');
        dbClosed = true;
      } catch (error) {
        console.error('⚠️ Error closing database:', error);
      }
    } else {
      dbClosed = true;
    }

    // ... rest of cleanup ...
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    setTimeout(() => {
      console.log('🚪 Exiting process...', {
        mqttClosed,
        dbClosed,
        serverClosed
      });
      process.exit(mqttClosed && dbClosed && serverClosed ? 0 : 1);
    }, 3000);
  }
}

// Initialize routes
app.use('/api/settings', settingsRoutes(db, systemSettings, connectMQTT));
app.use('/api/mqtt', mqttRoutes);

// Test MQTT connection
app.post('/api/test-mqtt', async (req, res) => {
  const testConfig = req.body;
  console.log('🧪 Testing MQTT connection with config:', testConfig);
  
  try {
    // Validate required fields
    if (!testConfig.host || !testConfig.port) {
      return res.status(400).json({ 
        success: false, 
        message: 'Host and port are required for MQTT connection test' 
      });
    }

    // Create a temporary MQTT client for testing
    const testClient = mqtt.connect(`mqtt://${testConfig.host}:${testConfig.port}`, {
      clientId: `test-${Math.random().toString(16).slice(3)}`,
      username: testConfig.username || undefined,
      password: testConfig.password || undefined,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 0
    });
    
    // Wait for connection or error
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        testClient.end(true, {}, () => {
          reject(new Error('Connection timeout - broker may be unreachable'));
        });
      }, 5000);

      testClient.once('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Test MQTT connection successful');
        testClient.end(true, {}, () => resolve());
      });
      
      testClient.once('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Test MQTT connection failed:', error);
        testClient.end(true, {}, () => reject(error));
      });
    });
    
    res.json({ success: true, message: 'MQTT connection test successful' });
  } catch (error) {
    console.error('❌ MQTT test failed:', error);
    
    let errorMessage = 'MQTT connection test failed';
    
    if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Please check if the MQTT broker is running and the host/port are correct.';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Host not found. Please check the broker hostname or IP address.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout. The broker may be unreachable or the port is incorrect.';
    } else if (error.message.includes('ECONNRESET')) {
      errorMessage = 'Connection reset by broker. Please check authentication credentials.';
    } else if (error.message.includes('EACCES')) {
      errorMessage = 'Access denied. Please check username and password credentials.';
    } else {
      errorMessage = `Connection failed: ${error.message}`;
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// Send test MQTT message
app.post('/api/test-mqtt-message', async (req, res) => {
  try {
    if (!mqttClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'MQTT client not initialized. Please check server configuration.' 
      });
    }
    
    if (!isConnected) {
      return res.status(400).json({ 
        success: false, 
        message: 'MQTT client not connected. Please establish connection to broker first.' 
      });
    }
    
    const testMessage = {
      locker_id: 'TEST-LOCKER',
      rfid_tag: '1234567890',
      timestamp: new Date().toISOString(),
      test: true
    };
    
    // Publish test message to a test topic
    mqttClient.publish('test/message', JSON.stringify(testMessage), { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Failed to publish test message:', err);
        let errorMessage = 'Failed to publish test message';
        
        if (err.message.includes('ECONNRESET')) {
          errorMessage = 'Connection lost while publishing. Please check broker connection.';
        } else if (err.message.includes('ENOTFOUND')) {
          errorMessage = 'Broker host not found. Please check network connectivity.';
        } else {
          errorMessage = `Publish failed: ${err.message}`;
        }
        
        res.status(500).json({ success: false, message: errorMessage });
      } else {
        console.log('📤 Published test MQTT message:', testMessage);
        res.json({ 
          success: true, 
          message: 'Test MQTT message published successfully to test/message topic' 
        });
      }
    });
  } catch (error) {
    console.error('❌ Error publishing test message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unexpected error while publishing test message' 
    });
  }
});

// Get configured locker expiry time for frontend
app.get('/api/settings/locker-expiry', async (req, res) => {
  try {
    const settings = await db.getAllSettings();
    const systemSettings = settings.find(s => s.key === 'systemSettings');
    
    console.log('🔍 Debug locker-expiry - systemSettings found:', !!systemSettings);
    if (systemSettings) {
      console.log('🔍 Debug locker-expiry - value type:', typeof systemSettings.value);
      console.log('🔍 Debug locker-expiry - raw value:', systemSettings.value);
    }
    
    let lockerExpiryHours = 24; // default (24 hours)
    
    if (systemSettings && systemSettings.value) {
      // Parse the value if it's a string (which it usually is from database)
      let settingsObj = systemSettings.value;
      if (typeof settingsObj === 'string') {
        settingsObj = JSON.parse(settingsObj);
        console.log('🔍 Debug locker-expiry - parsed object:', settingsObj);
      }
      
      console.log('🔍 Debug locker-expiry - lockerExpiryMinutes:', settingsObj.lockerExpiryMinutes);
      console.log('🔍 Debug locker-expiry - lockerExpiryHours:', settingsObj.lockerExpiryHours);
      
      // Use lockerExpiryMinutes if available, otherwise fall back to legacy lockerExpiryHours
      if (settingsObj.lockerExpiryMinutes && settingsObj.lockerExpiryMinutes > 0) {
        lockerExpiryHours = settingsObj.lockerExpiryMinutes / 60; // Convert minutes to hours
        console.log(`✅ Using lockerExpiryMinutes: ${settingsObj.lockerExpiryMinutes} -> ${lockerExpiryHours} hours`);
      } else if (settingsObj.lockerExpiryHours && settingsObj.lockerExpiryHours > 0) {
        lockerExpiryHours = settingsObj.lockerExpiryHours;
        console.log(`✅ Using lockerExpiryHours: ${lockerExpiryHours}`);
      }
    }
    
    console.log('🔍 Debug locker-expiry - final result:', lockerExpiryHours);
    res.json({ lockerExpiryHours });
  } catch (error) {
    console.error('❌ Error getting locker expiry setting:', error);
    res.status(500).json({ error: 'Failed to get locker expiry setting' });
  }
});

// Manual trigger for expiry check (for testing/admin purposes)
app.post('/api/admin/check-expired-lockers', async (req, res) => {
  try {
    console.log('🔧 Manual expiry check triggered via API');
    await checkExpiredLockers();
    res.json({ success: true, message: 'Expiry check completed' });
  } catch (error) {
    console.error('❌ Error in manual expiry check:', error);
    res.status(500).json({ error: 'Failed to check expired lockers' });
  }
});

// Fix orphaned lockers (lockers marked as occupied but users have no assignment)
app.post('/api/admin/fix-orphaned-lockers', async (req, res) => {
  try {
    console.log('🔧 Fixing orphaned lockers triggered via API');
    
    const allUsers = await db.getAllUsers();
    const allLockers = await db.getAllLockers();
    
    let fixedCount = 0;
    const fixedLockers = [];
    
    // Find lockers that are occupied but the assigned user has no locker_id
    for (const locker of allLockers) {
      if (locker.status === 'occupied' && locker.user_id) {
        const user = allUsers.find(u => u.id === locker.user_id);
        
        // If user doesn't exist or user has no locker assignment, this is orphaned
        if (!user || !user.locker_id || user.locker_id !== locker.id) {
          console.log(`🔧 Fixing orphaned locker: ${locker.name} (${locker.locker_id}) - was assigned to user ${locker.user_id}`);
          
          // Update locker - set to available and clear user assignment
          await db.updateLocker(locker.id, {
            status: 'available',
            user_id: null
          });
          
          // Send MQTT command to remove user from locker (if connected)
          if (mqttClient && isConnected) {
            const command = {
              cmd: "deluser",
              doorip: locker.ip_address,
              uid: locker.user_id
            };
            
            mqttClient.publish(`${locker.topic}/cmd`, JSON.stringify(command));
            console.log(`📡 Sent deluser command for orphaned locker: ${JSON.stringify(command)}`);
          }
          
          // Log activity
          await db.logActivity({
            user_id: locker.user_id,
            locker_id: locker.id,
            action: 'fix_orphaned_locker',
            details: { 
              lockerId: locker.id, 
              userId: locker.user_id,
              reason: 'Locker was occupied but user had no assignment',
              fixedAt: new Date().toISOString()
            }
          });
          
          fixedLockers.push({
            lockerId: locker.id,
            lockerName: locker.name,
            previousUserId: locker.user_id
          });
          
          fixedCount++;
        }
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} orphaned locker(s)`);
      // Update caches after fixing
      lockersCache = await db.getAllLockers();
      usersCache = await db.getAllUsers();
      
      // Emit socket events for real-time updates
      if (io) {
        fixedLockers.forEach(fixed => {
          io.emit('locker-updated', { 
            id: fixed.lockerId, 
            status: 'available', 
            user_id: null 
          });
        });
      }
    } else {
      console.log('✅ No orphaned lockers found');
    }
    
    res.json({ 
      success: true, 
      message: `Fixed ${fixedCount} orphaned locker(s)`,
      fixedLockers: fixedLockers
    });
  } catch (error) {
    console.error('❌ Error fixing orphaned lockers:', error);
    res.status(500).json({ error: 'Failed to fix orphaned lockers' });
  }
});

// RFID Tag Management API Endpoints
app.get('/api/rfid/check/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const isAvailable = await db.isRfidTagAvailable(tag);
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('❌ Error checking RFID tag:', error);
    res.status(500).json({ error: 'Failed to check RFID tag' });
  }
});

app.get('/api/rfid/user/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const user = await db.getUserByRfidTag(tag);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching user by RFID tag:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user creation to validate RFID tag uniqueness
app.post('/api/users', async (req, res) => {
  try {
    const { rfid_tag, ...userData } = req.body;
    
    // Check if RFID tag is already in use
    if (rfid_tag && !(await db.isRfidTagAvailable(rfid_tag))) {
      return res.status(400).json({ error: 'RFID tag is already assigned to another user' });
    }
    
    const newUser = await db.createUser({ ...userData, rfid_tag });
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      action: 'user_created',
      details: { userId: newUser.id, rfid_tag },
      ip_address: req.ip
    });
    
    io.emit('user-created', newUser);
    res.json(newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error.code === '23505' && error.constraint === 'users_rfid_tag_unique') {
      res.status(400).json({ error: 'RFID tag is already assigned to another user' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// Update user update to validate RFID tag uniqueness
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rfid_tag, ...userData } = req.body;
    
    // Check if RFID tag is already in use by another user
    if (rfid_tag && !(await db.isRfidTagAvailable(rfid_tag, parseInt(id)))) {
      return res.status(400).json({ error: 'RFID tag is already assigned to another user' });
    }
    
    const updatedUser = await db.updateUser(id, { ...userData, rfid_tag });
    usersCache = await db.getAllUsers();
    
    // Log activity
    await db.logActivity({
      user_id: id,
      action: 'user_updated',
      details: { rfid_tag },
      ip_address: req.ip
    });
    
    io.emit('user-updated', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    if (error.code === '23505' && error.constraint === 'users_rfid_tag_unique') {
      res.status(400).json({ error: 'RFID tag is already assigned to another user' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
});

// --- MQTT Status API Endpoint ---
app.get('/api/status', (req, res) => {
  res.json({ 
    mqtt: mqttStatus,
    config: systemSettings.mqttConfig,
    connected: isConnected
  });
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  // Try client_build first (Docker container), then client/build (development)
  const indexPath = path.join(__dirname, 'client_build/index.html');
  const devIndexPath = path.join(__dirname, 'client/build/index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (fs.existsSync(devIndexPath)) {
    res.sendFile(devIndexPath);
  } else {
    res.status(404).json({ error: 'Frontend not found. Please build the React app.' });
  }
});

// Ensure graceful shutdown always closes MQTT client
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down...');
  try {
    if (mqttClient) {
      await new Promise((resolve) => {
        mqttClient.end(false, {}, resolve);
      });
      console.log('✅ MQTT client closed');
    }
  } catch (e) {
    console.error('⚠️ Error closing MQTT client:', e);
  }
  // ... existing shutdown logic ...
  process.exit(0);
});

// Add this middleware before your routes (after app initialization, before routes)
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is restarting, please try again shortly.' });
  } else {
    next();
  }
});

