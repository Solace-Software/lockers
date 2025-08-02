# Home Assistant Add-on: Gym Lockers Management System

[![Release][release-shield]][release] ![Project Stage][project-stage-shield] ![Project Maintenance][maintenance-shield]

A comprehensive management system for gym lockers with MQTT support.

## About

This Home Assistant add-on provides a complete solution for managing gym lockers. It includes:

- Web-based management interface
- MQTT integration for real-time updates
- Built-in database for storing locker and user information
- Real-time status monitoring
- User management
- Group management
- Analytics and reporting

## Features

- 🔒 Secure locker management
- 📊 Real-time analytics
- 👥 User and group management
- 🔔 MQTT notifications
- 🌐 Web-based interface
- 🔐 Integration with Home Assistant

## Installation

1. Navigate to your Home Assistant instance
2. Go to Settings -> Add-ons -> Add-on Store
3. Click the 3-dots menu at top right -> Repositories
4. Add this repository URL: `https://github.com/YourUsername/lockers`
5. The add-on will show up in the store. Click install!

## Configuration

The add-on can be configured via the Home Assistant UI:

```yaml
database:
  host: ""  # Leave empty for internal database
  port: 3306
  name: "gym_lockers"
  username: ""
  password: ""
mqtt:
  use_internal: true  # Use built-in MQTT broker
  external:  # Only needed if use_internal is false
    host: ""
    port: 1883
    username: ""
    password: ""
system:
  auto_refresh: 30  # Data refresh interval in seconds
  data_retention: 90  # Days to keep historical data
  debug_mode: false
```

## Support

Got questions?

You have several options to get them answered:

- The [Home Assistant Discord Chat Server][discord]
- The Home Assistant [Community Forum][forum]
- Join the [Reddit subreddit][reddit] in [/r/homeassistant][reddit]

## Contributing

This is an active open-source project. Feel free to use the issue tracker to report any issues or suggest improvements!

## License

MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[discord]: https://discord.gg/c5DvZ4e
[forum]: https://community.home-assistant.io
[maintenance-shield]: https://img.shields.io/maintenance/yes/2024.svg
[project-stage-shield]: https://img.shields.io/badge/project%20stage-stable-green.svg
[release-shield]: https://img.shields.io/badge/version-v1.2.6-blue.svg
[release]: https://github.com/YourUsername/lockers/tree/v1.2.6
[reddit]: https://reddit.com/r/homeassistant