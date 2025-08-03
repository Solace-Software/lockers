import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import StorageStatus from './components/StorageStatus';
import Sidebar from './components/Sidebar';
import Lockers from './pages/Lockers';
import Groups from './pages/Groups';
import Users from './pages/Users';
import Heartbeat from './pages/Heartbeat';
import Settings from './pages/Settings';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

function AppContent() {
  const { offlineAlerts } = useSocket();
  const [mqttStatus, setMqttStatus] = useState('connected');

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/status');
        if (isMounted) setMqttStatus(res.data.mqtt);
      } catch (e) {
        if (isMounted) setMqttStatus('disconnected');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // poll every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex h-screen bg-dashboard-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* MQTT Status Banner */}
          {mqttStatus === 'disconnected' && (
            <div className="bg-red-600 text-white text-center py-2 font-semibold z-50">
              MQTT connection lost. Locker status updates are temporarily unavailable.
            </div>
          )}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dashboard-900">
            <Routes>
              <Route path="/" element={<Navigate to="/lockers" replace />} />
              <Route path="/lockers" element={<Lockers />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/users" element={<Users />} />
              <Route path="/heartbeat" element={<Heartbeat />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
      
      {/* Offline Alerts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {offlineAlerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-dashboard-800 border border-danger-600 rounded-xl p-4 shadow-card max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-danger-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Locker Offline Alert</p>
                <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <Toaster position="top-right" />
      <StorageStatus />
    </Router>
  );
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App; 