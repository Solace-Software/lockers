# Quick Deployment Guide - Gym Locker Admin Dashboard

## 🚀 **Updated Home Assistant Addon (v1.4.0)**

### **Key Changes in v1.4.0:**
- ✅ **Internal Database Only**: No external database credentials required
- ✅ **Optional MQTT**: Can run without MQTT connectivity
- ✅ **Enhanced Configuration**: More configuration options available
- ✅ **Better Error Handling**: Graceful handling of missing MQTT
- ✅ **UI Configuration**: MQTT settings configurable through web interface

## 📦 **Installation Steps**

### **1. Add Repository**
```
Home Assistant → Settings → Add-ons → Add-on Store → Repositories
Add: https://github.com/Solace-Software/lockers
```

### **2. Install Addon**
```
Find "Gym Locker Admin Dashboard"
Click Install
```

### **3. Configure (Optional)**
```
Click Configuration tab
Default settings work out of the box:
- MQTT: Disabled (can be enabled later)
- Database: Internal (no configuration needed)
- System: Default settings
Click Save
```

### **4. Start Addon**
```
Click Start
Wait for initialization (30-60 seconds)
Click Open Web UI
```

## ⚙️ **Configuration Options**

### **MQTT Settings (Optional)**
```json
{
  "mqtt_enabled": false,                    // Enable/disable MQTT
  "use_external_mqtt": false,               // Use external MQTT broker
  "external_mqtt_host": "",                 // External MQTT host
  "external_mqtt_port": 1883,               // External MQTT port
  "external_mqtt_username": "",             // External MQTT username
  "external_mqtt_password": "",             // External MQTT password
  "external_mqtt_client_id": "gym-admin"    // External MQTT client ID
}
```

### **System Settings**
```json
{
  "system_auto_refresh": 30,                // Auto-refresh interval (seconds)
  "system_data_retention_days": 90,         // Data retention period
  "system_backup_enabled": true,            // Enable automatic backups
  "system_debug_mode": false                // Enable debug mode
}
```

### **Notification Settings**
```json
{
  "notifications_email_alerts": true,       // Enable email alerts
  "notifications_usage_reports": false,     // Enable usage reports
  "notifications_real_time_updates": true   // Enable real-time updates
}
```

### **Security Settings**
```json
{
  "security_session_timeout": 30,           // Session timeout (minutes)
  "security_password_policy": "standard",   // Password policy
  "security_two_factor_auth": false,        // Enable 2FA
  "security_audit_logging": true            // Enable audit logging
}
```

## 🌐 **Access Methods**

### **Method 1: Home Assistant Ingress (Recommended)**
```
Home Assistant → Sidebar → Gym Locker Dashboard
```

### **Method 2: Direct Port Access**
```
http://your-ha-ip:3001
```

## 🔧 **MQTT Configuration**

### **Option 1: Disabled (Default)**
- App runs without MQTT connectivity
- Can be enabled later through web interface
- No MQTT configuration required

### **Option 2: Built-in MQTT**
```json
{
  "mqtt_enabled": true,
  "use_external_mqtt": false
}
```

### **Option 3: External MQTT**
```json
{
  "mqtt_enabled": true,
  "use_external_mqtt": true,
  "external_mqtt_host": "192.168.1.100",
  "external_mqtt_port": 1883,
  "external_mqtt_username": "your_username",
  "external_mqtt_password": "your_password"
}
```

## 📊 **Database Management**

### **Automatic Management**
- Database is automatically initialized
- No external database setup required
- Data persists across restarts
- Automatic schema updates

### **Data Location**
```
Home Assistant → /data/db/ (internal)
```

## 🛠️ **Troubleshooting**

### **Addon Won't Start**
1. Check configuration syntax
2. Review addon logs
3. Restart Home Assistant if needed

### **Web Interface Not Accessible**
1. Ensure addon is started
2. Check port 3001 is not in use
3. Try accessing via Home Assistant sidebar

### **MQTT Issues**
1. Check if MQTT is enabled
2. Verify MQTT settings in web interface
3. Check MQTT logs in addon logs

### **Database Issues**
1. Database is automatically managed
2. Check addon logs for database errors
3. Restart addon if needed

## 📈 **Performance**

### **Resource Requirements**
- **CPU**: 1-2 cores
- **RAM**: 1-2 GB
- **Storage**: 2-5 GB (depending on data retention)

### **Scalability**
- **Small**: < 50 lockers (default settings)
- **Medium**: 50-200 lockers (increase MQTT connections)
- **Large**: > 200 lockers (optimize settings)

## 🔄 **Updates**

### **Automatic Updates**
- Updates available through Home Assistant addon store
- Configuration preserved during updates
- Database data preserved during updates

### **Manual Updates**
```
Home Assistant → Add-ons → Gym Locker Dashboard → Update
```

## 📋 **Next Steps**

1. **Initial Setup**: Access web interface and configure settings
2. **Add Lockers**: Add your locker devices through the web interface
3. **Add Users**: Create user accounts and assign RFID tags
4. **Configure MQTT**: Enable MQTT if needed for locker communication
5. **Monitor**: Use the dashboard to monitor locker status

## 🎯 **Benefits of v1.4.0**

### ✅ **Simplified Deployment**
- No external database setup required
- No external MQTT broker needed
- Works out of the box with default settings

### ✅ **Flexible Configuration**
- MQTT can be disabled or configured later
- All settings configurable through web interface
- Enhanced configuration options

### ✅ **Better Integration**
- Native Home Assistant addon
- Ingress support
- Integrated with HA backup system
- HA logs integration

### ✅ **Improved Reliability**
- Graceful handling of missing MQTT
- Better error handling
- Automatic database management
- Persistent data storage

---

**Ready to deploy!** The updated addon provides a complete gym locker management solution with no external dependencies and flexible MQTT configuration. 