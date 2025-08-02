import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Lock, 
  Users, 
  Settings,
  Wifi,
  WifiOff,
  Layers,
  Activity
} from 'lucide-react';

import { useSocket } from '../contexts/SocketContext';

const Sidebar = () => {
  const { isConnected } = useSocket();

  const navItems = [
    { path: '/lockers', icon: Lock, label: 'Lockers' },
    { path: '/groups', icon: Layers, label: 'Groups' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/heartbeat', icon: Activity, label: 'Heartbeat' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-20 sidebar">
      <div className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xs font-bold text-white">GYM</h1>
            <div className="flex flex-col items-center space-y-1 mt-2">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-success-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-danger-400" />
              )}
              <span className={`text-xs ${isConnected ? 'text-success-400' : 'text-danger-400'}`}>
                {isConnected ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="mt-8 flex-1">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-12 h-12 mx-auto rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'text-gray-400 hover:text-white hover:bg-dashboard-800'
                }`
              }
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-dashboard-700">
        <div className="text-xs text-gray-500 text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 