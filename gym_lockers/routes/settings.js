const express = require('express');
const router = express.Router();

module.exports = function(db, systemSettings, connectMQTT) {
  // Get all settings
  router.get('/', async (req, res) => {
    try {
      const settings = await db.getAllSettings();
      
      // Create clean response object to avoid circular references
      const response = {
        mqttConfig: systemSettings.mqttConfig ? {
          host: systemSettings.mqttConfig.host || '',
          port: systemSettings.mqttConfig.port || 1883,
          username: systemSettings.mqttConfig.username || '',
          password: systemSettings.mqttConfig.password || '',
          clientId: systemSettings.mqttConfig.clientId || 'gym-admin',
          allowAnonymous: systemSettings.mqttConfig.allowAnonymous || false
        } : null,
        notifications: systemSettings.notifications ? {
          emailAlerts: systemSettings.notifications.emailAlerts || false,
          usageReports: systemSettings.notifications.usageReports || false,
          realTimeUpdates: systemSettings.notifications.realTimeUpdates || true
        } : {
          emailAlerts: false,
          usageReports: false,
          realTimeUpdates: true
        },
        systemSettings: systemSettings.systemSettings ? {
          autoRefresh: systemSettings.systemSettings.autoRefresh || 30,
          dataRetention: systemSettings.systemSettings.dataRetention || 90,
          lockerExpiryMinutes: systemSettings.systemSettings.lockerExpiryMinutes || 
                              (systemSettings.systemSettings.lockerExpiryHours ? systemSettings.systemSettings.lockerExpiryHours * 60 : 1440)
        } : {
          autoRefresh: 30,
          dataRetention: 90,
          lockerExpiryMinutes: 1440
        }
      };

      // Override with database settings if they exist
      if (settings.length > 0) {
        settings.forEach(setting => {
          if (setting.key === 'mqttConfig' && setting.value) {
            // MySQL JSON type already parses the value, so use it directly if it's an object
            const dbMqttConfig = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
            response.mqttConfig = { ...response.mqttConfig, ...dbMqttConfig };
          } else if (setting.key === 'notifications' && setting.value) {
            // MySQL JSON type already parses the value, so use it directly if it's an object
            const dbNotifications = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
            response.notifications = { ...response.notifications, ...dbNotifications };
          } else if (setting.key === 'systemSettings' && setting.value) {
            // MySQL JSON type already parses the value, so use it directly if it's an object
            const dbSystemSettings = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
            response.systemSettings = { ...response.systemSettings, ...dbSystemSettings };
          }
        });
      }

      res.json(response);
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  // Save settings
  router.post('/', async (req, res) => {
    try {
      const { mqttConfig, notifications, systemSettings: newSystemSettings } = req.body;
      
      // Save each setting to database
      const savedSettings = await Promise.all([
        db.setSetting('mqttConfig', mqttConfig, 'MQTT broker configuration'),
        db.setSetting('notifications', notifications, 'Notification preferences'),
        db.setSetting('systemSettings', newSystemSettings, 'System settings')
      ]);
      
      // Update in-memory settings
      systemSettings.mqttConfig = { ...systemSettings.mqttConfig, ...mqttConfig };
      systemSettings.notifications = notifications;
      systemSettings.systemSettings = newSystemSettings;
      
      // Reconnect MQTT if configuration changed
      if (JSON.stringify(mqttConfig) !== JSON.stringify(systemSettings.mqttConfig)) {
        console.log('🔄 MQTT configuration changed, reconnecting...');
        connectMQTT();
      }
      
      res.json({ success: true, settings: savedSettings });
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  return router;
}; 