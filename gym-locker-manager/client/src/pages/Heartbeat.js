import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Wifi, WifiOff, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const Heartbeat = () => {
  const [heartbeatData, setHeartbeatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchHeartbeatStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/heartbeat-status');
      setHeartbeatData(response.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching heartbeat status:', err);
      setError('Failed to fetch heartbeat status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeartbeatStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHeartbeatStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatLastHeartbeat = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (isOnline) => {
    return isOnline ? (
      <Wifi className="w-5 h-5 text-green-500" />
    ) : (
      <WifiOff className="w-5 h-5 text-red-500" />
    );
  };



  if (loading && !heartbeatData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
          <button 
            onClick={fetchHeartbeatStatus}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Heartbeat Monitor</h1>
            <p className="text-gray-600 mt-2">Real-time locker connectivity status and uptime monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchHeartbeatStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            {lastUpdate && (
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {heartbeatData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Lockers</p>
                  <p className="text-3xl font-bold text-gray-900">{heartbeatData.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Online</p>
                  <p className="text-3xl font-bold text-green-600">{heartbeatData.online}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Offline</p>
                  <p className="text-3xl font-bold text-red-600">{heartbeatData.offline}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Uptime</p>
                  <p className="text-3xl font-bold text-gray-900">{formatUptime(heartbeatData.averageUptime)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Online Lockers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-green-500" />
                <span>Online Lockers ({heartbeatData.lockersByStatus.online.length})</span>
              </h2>
            </div>
            <div className="p-6">
              {heartbeatData.lockersByStatus.online.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heartbeatData.lockersByStatus.online.map((locker) => (
                    <div key={locker.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-green-900">{locker.name}</h3>
                        {getStatusIcon(true)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Uptime:</span>
                          <span className="text-green-900 font-medium">{formatUptime(locker.uptime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Last Heartbeat:</span>
                          <span className="text-green-900 font-medium">{formatLastHeartbeat(locker.lastHeartbeat)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No online lockers</p>
              )}
            </div>
          </div>

          {/* Offline Lockers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <WifiOff className="w-5 h-5 text-red-500" />
                <span>Offline Lockers ({heartbeatData.lockersByStatus.offline.length})</span>
              </h2>
            </div>
            <div className="p-6">
              {heartbeatData.lockersByStatus.offline.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heartbeatData.lockersByStatus.offline.map((locker) => (
                    <div key={locker.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-red-900">{locker.name}</h3>
                        {getStatusIcon(false)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-700">Last Uptime:</span>
                          <span className="text-red-900 font-medium">{formatUptime(locker.uptime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700">Last Heartbeat:</span>
                          <span className="text-red-900 font-medium">{formatLastHeartbeat(locker.lastHeartbeat)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No offline lockers</p>
              )}
            </div>
          </div>

          {/* No Heartbeat Lockers */}
          {heartbeatData.lockersByStatus.noHeartbeat.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span>No Heartbeat ({heartbeatData.lockersByStatus.noHeartbeat.length})</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heartbeatData.lockersByStatus.noHeartbeat.map((locker) => (
                    <div key={locker.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-yellow-900">{locker.name}</h3>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <p className="text-sm text-yellow-700">No heartbeat received</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Heartbeat; 