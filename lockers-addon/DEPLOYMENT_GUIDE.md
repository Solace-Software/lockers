# Deployment Guide - Gym Locker Admin Dashboard

This guide provides detailed deployment instructions for different scales of gym locker management installations.

## 📊 Deployment Scales

### 🏠 Small Scale (1-50 lockers)
**Typical Use**: Small gyms, fitness centers, community centers

**Requirements**:
- Home Assistant Core/Supervisor
- MariaDB addon
- Mosquitto broker addon
- 2GB RAM minimum
- 10GB storage

**Configuration**:
```json
{
  "db_host": "core-mariadb",
  "db_port": 3306,
  "db_user": "gym_admin",
  "db_password": "secure_password",
  "db_name": "gym_lockers",
  "mqtt_host": "core-mosquitto",
  "mqtt_port": 1883,
  "mqtt_username": "",
  "mqtt_password": "",
  "mqtt_client_id": "gym-admin",
  "system_auto_refresh": 30,
  "system_data_retention_days": 90,
  "system_backup_enabled": true,
  "system_debug_mode": false
}
```

**Installation Steps**:
1. Install MariaDB addon
2. Install Mosquitto broker addon
3. Install Gym Locker Dashboard addon
4. Configure database and MQTT settings
5. Start all addons

### 🏢 Medium Scale (50-200 lockers)
**Typical Use**: Large gyms, sports complexes, universities

**Requirements**:
- Home Assistant Core/Supervisor
- Dedicated MariaDB instance (recommended)
- Mosquitto broker addon
- 4GB RAM minimum
- 20GB storage
- SSD storage recommended

**Configuration**:
```json
{
  "db_host": "core-mariadb",
  "db_port": 3306,
  "db_user": "gym_admin",
  "db_password": "very_secure_password",
  "db_name": "gym_lockers",
  "mqtt_host": "core-mosquitto",
  "mqtt_port": 1883,
  "mqtt_username": "gym_mqtt_user",
  "mqtt_password": "mqtt_password",
  "mqtt_client_id": "gym-admin-medium",
  "mqtt_max_connections": 200,
  "mqtt_max_message_size": 2048,
  "system_auto_refresh": 15,
  "system_data_retention_days": 180,
  "system_backup_enabled": true,
  "system_debug_mode": false,
  "notifications_email_alerts": true,
  "notifications_usage_reports": true,
  "security_audit_logging": true
}
```

**Installation Steps**:
1. Install MariaDB addon with dedicated database
2. Install Mosquitto broker addon with authentication
3. Install Gym Locker Dashboard addon
4. Configure enhanced settings
5. Set up automated backups
6. Configure monitoring

### 🏭 Large Scale (200+ lockers)
**Typical Use**: Multi-location gym chains, large sports facilities

**Requirements**:
- Dedicated Home Assistant instance or separate server
- Dedicated MariaDB server
- MQTT cluster or dedicated broker
- 8GB RAM minimum
- 50GB+ storage
- SSD storage required
- Load balancer (optional)

**Configuration**:
```json
{
  "db_host": "dedicated-mariadb-server",
  "db_port": 3306,
  "db_user": "gym_admin",
  "db_password": "enterprise_secure_password",
  "db_name": "gym_lockers",
  "mqtt_host": "mqtt-cluster.example.com",
  "mqtt_port": 1883,
  "mqtt_username": "gym_mqtt_user",
  "mqtt_password": "enterprise_mqtt_password",
  "mqtt_client_id": "gym-admin-large",
  "mqtt_websocket_port": 9001,
  "mqtt_max_connections": 500,
  "mqtt_max_message_size": 4096,
  "system_auto_refresh": 10,
  "system_data_retention_days": 365,
  "system_backup_enabled": true,
  "system_debug_mode": false,
  "notifications_email_alerts": true,
  "notifications_usage_reports": true,
  "notifications_real_time_updates": true,
  "security_session_timeout": 15,
  "security_password_policy": "enterprise",
  "security_two_factor_auth": true,
  "security_audit_logging": true
}
```

**Installation Steps**:
1. Set up dedicated MariaDB server
2. Configure MQTT cluster or dedicated broker
3. Install Gym Locker Dashboard addon
4. Configure enterprise settings
5. Set up comprehensive monitoring
6. Implement backup strategy
7. Configure load balancing (if needed)

## 🔧 Advanced Configuration

### Database Optimization

**For Medium/Large Installations**:
```sql
-- MariaDB optimization settings
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL innodb_log_file_size = 268435456; -- 256MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL innodb_file_per_table = 1;
```

**Database Maintenance Schedule**:
- Daily: Check connection health
- Weekly: Analyze table performance
- Monthly: Optimize tables and indexes
- Quarterly: Review and update indexes

### MQTT Optimization

**For High-Volume Installations**:
```conf
# mosquitto.conf optimizations
max_connections 1000
max_queued_messages 1000
max_inflight_messages 20
persistence true
persistence_location /mosquitto/data/
log_type error
```

**MQTT Security**:
```conf
# Enable authentication
allow_anonymous false
password_file /mosquitto/config/passwd
acl_file /mosquitto/config/acl
```

### Performance Monitoring

**Key Metrics to Monitor**:
- Database connection count
- MQTT message throughput
- Web interface response time
- Memory usage
- CPU utilization
- Disk I/O

**Monitoring Tools**:
- Home Assistant system monitor
- MariaDB performance schema
- MQTT broker metrics
- Custom monitoring scripts

## 🔒 Security Hardening

### Database Security
```sql
-- Create dedicated user with limited privileges
CREATE USER 'gym_admin'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON gym_lockers.* TO 'gym_admin'@'%';
FLUSH PRIVILEGES;

-- Enable SSL connections
ALTER USER 'gym_admin'@'%' REQUIRE SSL;
```

### MQTT Security
```conf
# mosquitto.conf security settings
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
acl_file /mosquitto/config/acl

# Enable TLS/SSL
listener 8883
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
```

### Web Security
- Enable HTTPS for all connections
- Implement rate limiting
- Use strong password policies
- Enable two-factor authentication
- Regular security updates

## 📈 Scaling Strategies

### Horizontal Scaling
1. **Database Clustering**: Use MariaDB Galera Cluster
2. **MQTT Clustering**: Deploy multiple MQTT brokers
3. **Load Balancing**: Use reverse proxy (nginx/traefik)
4. **Microservices**: Split into separate services

### Vertical Scaling
1. **Increase Resources**: More RAM, CPU, storage
2. **Optimize Configuration**: Fine-tune settings
3. **Caching**: Implement Redis cache layer
4. **CDN**: Use content delivery network

### Geographic Distribution
1. **Multi-Region**: Deploy in multiple locations
2. **Edge Computing**: Process data closer to users
3. **Data Replication**: Sync data across regions
4. **Failover**: Automatic failover between regions

## 🔄 Backup and Recovery

### Backup Strategy

**Automated Backups**:
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$DATE.sql
gzip backup_$DATE.sql
# Upload to cloud storage
aws s3 cp backup_$DATE.sql.gz s3://backup-bucket/
```

**Backup Schedule**:
- Daily: Full database backup
- Weekly: Configuration backup
- Monthly: Complete system backup

### Recovery Procedures

**Database Recovery**:
```bash
# Restore from backup
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < backup_20240115_120000.sql
```

**Configuration Recovery**:
1. Restore addon configuration
2. Restore MQTT broker settings
3. Restore SSL certificates
4. Verify connectivity

## 🚨 Disaster Recovery

### High Availability Setup
1. **Primary Server**: Active production server
2. **Secondary Server**: Standby server
3. **Load Balancer**: Distribute traffic
4. **Monitoring**: Health checks and alerts

### Failover Procedures
1. **Automatic Failover**: Health check triggers
2. **Manual Failover**: Admin-initiated switch
3. **Data Synchronization**: Keep servers in sync
4. **Rollback Plan**: Quick recovery procedures

## 📊 Performance Tuning

### Database Tuning
```sql
-- Optimize for read-heavy workloads
SET GLOBAL innodb_buffer_pool_size = 70% of RAM;
SET GLOBAL innodb_log_file_size = 256MB;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Add indexes for common queries
CREATE INDEX idx_locker_status ON lockers(status);
CREATE INDEX idx_user_rfid ON users(rfid_tag);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);
```

### Application Tuning
```javascript
// Connection pooling
const pool = mysql.createPool({
  connectionLimit: 20,
  host: config.db_host,
  user: config.db_user,
  password: config.db_password,
  database: config.db_name
});

// MQTT connection optimization
const mqttOptions = {
  keepalive: 60,
  reconnectPeriod: 1000,
  connectTimeout: 30000,
  clean: true
};
```

## 🔍 Monitoring and Alerting

### Key Metrics
- **Database**: Connection count, query performance, storage usage
- **MQTT**: Message throughput, connection count, error rate
- **Application**: Response time, error rate, memory usage
- **System**: CPU, memory, disk, network

### Alerting Rules
- Database connection failures
- MQTT connection drops
- High error rates
- Performance degradation
- Security incidents

### Monitoring Tools
- **Home Assistant**: Built-in system monitoring
- **Prometheus**: Custom metrics collection
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification

## 📋 Maintenance Checklist

### Daily
- [ ] Check system health
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Monitor performance metrics

### Weekly
- [ ] Analyze performance trends
- [ ] Review security logs
- [ ] Update monitoring dashboards
- [ ] Test backup restoration

### Monthly
- [ ] Performance optimization
- [ ] Security updates
- [ ] Capacity planning
- [ ] Documentation updates

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Disaster recovery test
- [ ] Update procedures

## 🆘 Emergency Procedures

### System Down
1. **Immediate**: Check addon status
2. **Diagnosis**: Review logs for errors
3. **Recovery**: Restart services if needed
4. **Investigation**: Root cause analysis

### Data Loss
1. **Assessment**: Determine data loss scope
2. **Recovery**: Restore from latest backup
3. **Validation**: Verify data integrity
4. **Prevention**: Update backup procedures

### Security Breach
1. **Containment**: Isolate affected systems
2. **Investigation**: Identify breach scope
3. **Recovery**: Restore from clean backup
4. **Prevention**: Update security measures

This deployment guide provides a comprehensive framework for scaling the Gym Locker Admin Dashboard from small installations to enterprise deployments. Each scale includes specific requirements, configurations, and best practices to ensure reliable and secure operation. 