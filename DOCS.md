# Home Assistant Add-on: Gym Lockers Management System

## Installation

The installation of this add-on is straightforward and easy to do.

1. Navigate in your Home Assistant frontend to **Settings** -> **Add-ons** -> **Add-on Store**.
2. Click the 3-dots menu at top right -> **Repositories**
3. Add this repository URL: `https://github.com/YourUsername/lockers`
4. Find the "Gym Lockers Management System" add-on and click it.
5. Click on the "INSTALL" button.

## How to use

1. Start the add-on.
2. Click the "OPEN WEB UI" button to open the Gym Lockers interface.
3. Log in with your Home Assistant credentials.

## Configuration

Add-on configuration:

```yaml
database:
  host: ""  # Leave empty for internal database
  port: 3306
  name: "gym_lockers"
  username: ""
  password: ""
mqtt:
  use_internal: true
  external:
    host: ""
    port: 1883
    username: ""
    password: ""
system:
  auto_refresh: 30
  data_retention: 90
  debug_mode: false
```

### Option: `database`

The database configuration allows you to either use the internal MariaDB database (recommended) or connect to an external MySQL/MariaDB server.

- `host`: The hostname/IP of your database server. Leave empty to use internal database.
- `port`: The port of your database server (default: 3306)
- `name`: The name of the database to use
- `username`: Database username
- `password`: Database password

### Option: `mqtt`

MQTT broker configuration for real-time updates.

- `use_internal`: Set to `true` to use the built-in MQTT broker (recommended)
- `external`: Configuration for external MQTT broker (only needed if `use_internal` is `false`)
  - `host`: MQTT broker hostname/IP
  - `port`: MQTT broker port (default: 1883)
  - `username`: MQTT username (optional)
  - `password`: MQTT password (optional)

### Option: `system`

General system settings.

- `auto_refresh`: How often to refresh data (in seconds, 10-300)
- `data_retention`: Number of days to keep historical data (1-365)
- `debug_mode`: Enable debug logging

## Network Ports

The following ports are used by this add-on:

- 3001/tcp: Web interface (Ingress enabled)
- 1883/tcp: MQTT broker (when using internal broker)
- 9001/tcp: MQTT WebSocket (when using internal broker)

## Database

The add-on can use either:

1. Internal MariaDB database (recommended)
2. External MySQL/MariaDB server

For the internal database, leave the database host field empty in the configuration.

## Integration with Home Assistant

This add-on integrates with Home Assistant in several ways:

1. Uses Home Assistant authentication
2. Provides MQTT sensors for locker status
3. Can trigger Home Assistant automations
4. Supports Home Assistant themes

## Backup and Restore

The add-on data is automatically included in Home Assistant backups when using the internal database.

If using an external database, make sure to back up your database separately.

## Troubleshooting

### The add-on fails to start

1. Check the add-on logs
2. Verify database configuration
3. Ensure MQTT broker is accessible
4. Check system resources

### Cannot access the web interface

1. Verify the add-on is running
2. Check if Ingress is enabled
3. Try accessing via the direct URL

### MQTT connection issues

1. Verify MQTT broker configuration
2. Check MQTT broker logs
3. Ensure correct credentials

## Support

Need help? Join our community:

- [Discord Chat][discord]
- [Community Forum][forum]
- [Reddit][reddit]

[discord]: https://discord.gg/c5DvZ4e
[forum]: https://community.home-assistant.io
[reddit]: https://reddit.com/r/homeassistant