# Quick Home Assistant Deployment Guide

## 🚀 Fast Deployment Steps

### Step 1: Install Required Addons

#### Install MariaDB:
1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Search for **"MariaDB"**
3. Click **Install**
4. Click **Start**
5. Note: Default credentials are usually `homeassistant`/`homeassistant`

#### Install Mosquitto Broker:
1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Search for **"Mosquitto broker"**
3. Click **Install**
4. Click **Start**
5. Leave authentication disabled for now (can be configured later)

### Step 2: Add the Repository

1. Go to **Settings** → **Add-ons** → **Add-on Store**
2. Click the **⋮** menu (top right corner)
3. Select **"Repositories"**
4. Add: `https://github.com/Solace-Software/lockers`
5. Click **Add**

### Step 3: Install the Addon

1. In the **Add-on Store**, you should now see **"Gym Locker Dashboard"**
2. Click on it
3. Click **Install**
4. Wait for installation to complete

### Step 4: Configure the Addon

1. Click on **Gym Locker Dashboard** addon
2. Go to **Configuration** tab
3. Use this configuration:

```json
{
  "db_host": "core-mariadb",
  "db_port": 3306,
  "db_user": "homeassistant",
  "db_password": "homeassistant",
  "db_name": "gym_lockers",
  "mqtt_host": "core-mosquitto",
  "mqtt_port": 1883,
  "mqtt_username": "",
  "mqtt_password": "",
  "mqtt_client_id": "gym-admin"
}
```

### Step 5: Start and Access

1. Click **Start** to launch the addon
2. Check the **Logs** tab for any errors
3. Once running, click **Open Web UI** to access the dashboard

## 🔧 Troubleshooting

### If the addon won't start:
1. Check that MariaDB and Mosquitto are running
2. Verify the configuration syntax
3. Check the addon logs for specific errors

### If you can't access the web UI:
1. Try accessing via Home Assistant sidebar
2. Check that ingress is enabled
3. Verify the addon is running

### If database connection fails:
1. Make sure MariaDB addon is running
2. Check the database credentials
3. Try using `homeassistant`/`homeassistant` as default

## 📞 Need Help?

If you encounter any issues:
1. Check the addon logs first
2. Verify all prerequisites are installed
3. Test database and MQTT connections separately
4. Review the full documentation in the repository 