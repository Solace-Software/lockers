# Gym Locker Admin Dashboard

A modern admin dashboard for managing MQTT-based gym lockers with real-time monitoring, user management, and analytics.

## Features

- 🔒 **Real-time Locker Management** - Monitor and control lockers via MQTT
- 👥 **User Management** - Manage gym members and locker assignments
- 📊 **Analytics Dashboard** - Usage statistics and performance metrics
- ⚙️ **System Settings** - MQTT configuration and system preferences
- 🔄 **Live Updates** - Real-time status updates via WebSocket
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MQTT** for IoT communication
- **Socket.IO** for real-time updates
- **CORS** for cross-origin requests

### Frontend
- **React 18** with functional components
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API calls

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MQTT Broker (optional for testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-locker-admin-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   MQTT_HOST=localhost
   MQTT_PORT=1883
   MQTT_USERNAME=your_username
   MQTT_PASSWORD=your_password
   PORT=5000
   NODE_ENV=development
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```
   The server will start on http://localhost:5000

2. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```
   The React app will start on http://localhost:3000

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## MQTT Topics

The system uses the following MQTT topics:

- `gym/lockers/{lockerId}/status` - Locker status updates
- `gym/lockers/{lockerId}/command` - Commands sent to lockers
- `gym/lockers/{lockerId}/response` - Responses from lockers

### Example MQTT Messages

**Status Update:**
```json
{
  "status": "occupied",
  "userId": "user-123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Command:**
```json
{
  "command": "unlock",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### Lockers
- `GET /api/lockers` - Get all lockers
- `POST /api/lockers` - Create a new locker
- `PUT /api/lockers/:id` - Update a locker
- `DELETE /api/lockers/:id` - Delete a locker
- `POST /api/lockers/:id/command` - Send command to locker

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Analytics
- `GET /api/analytics/usage` - Get usage statistics

## Project Structure

```
gym-locker-admin-dashboard/
├── server.js                 # Main server file
├── package.json             # Backend dependencies
├── .env                     # Environment variables
├── client/                  # React frontend
│   ├── public/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── index.js        # App entry point
│   └── package.json        # Frontend dependencies
└── README.md
```

## Features in Detail

### Dashboard
- Real-time overview of all lockers
- Utilization statistics
- Quick actions for common tasks
- Live status updates

### Locker Management
- Add, edit, and delete lockers
- Send commands (lock, unlock, maintenance)
- Filter by status and search functionality
- Real-time status monitoring

### User Management
- Manage gym members
- Assign lockers to users
- Track membership types
- User activity history

### Analytics
- Usage trends and patterns
- Performance metrics
- Location-based statistics
- Export capabilities

### Settings
- MQTT configuration
- Notification preferences
- System preferences
- Security settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please open an issue on GitHub.

---

**Note:** This is a demo application. For production use, consider adding:
- Database integration (PostgreSQL, MongoDB)
- Authentication and authorization
- SSL/TLS encryption
- Rate limiting
- Logging and monitoring
- Backup and recovery procedures 