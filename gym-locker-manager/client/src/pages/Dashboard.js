import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Users, 
  Activity, 
  Plus,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';

const Dashboard = () => {
  const { socket, isConnected } = useSocket();
  const [lockers, setLockers] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('locker-updated', (updatedLocker) => {
        setLockers(prev => prev.map(l => l.id === updatedLocker.id ? updatedLocker : l));
      });

      socket.on('locker-added', (newLocker) => {
        setLockers(prev => [...prev, newLocker]);
      });

      socket.on('locker-deleted', (deletedLocker) => {
        setLockers(prev => prev.filter(l => l.id !== deletedLocker.id));
      });
    }

    return () => {
      if (socket) {
        socket.off('locker-updated');
        socket.off('locker-added');
        socket.off('locker-deleted');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [lockersRes, usersRes, analyticsRes] = await Promise.all([
        axios.get('/api/lockers'),
        axios.get('/api/users'),
        axios.get('/api/analytics/usage')
      ]);

      setLockers(lockersRes.data);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-success-600 bg-success-50';
      case 'occupied': return 'text-warning-600 bg-warning-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '🔓';
      case 'occupied': return '🔒';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your gym lockers in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Lock className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lockers</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Lock className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.available || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Users className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.occupied || 0}</p>
            </div>
          </div>
        </div>


      </div>

      {/* Utilization Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilization Rate</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.utilization || 0}%` }}
                ></div>
              </div>
            </div>
            <span className="text-2xl font-bold text-primary-600">{analytics.utilization || 0}%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {analytics.occupied || 0} of {analytics.total || 0} lockers in use
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 24 hours</span>
              <span className="text-sm font-medium text-gray-900">{analytics.usage24h || 0} lockers used</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 7 days</span>
              <span className="text-sm font-medium text-gray-900">{analytics.usage7d || 0} lockers used</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Locker Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Live Locker Status</h3>
          <button 
            onClick={fetchData}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {lockers.map((locker) => (
            <div 
              key={locker.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                locker.status === 'available' ? 'border-success-200 bg-success-50' :
                locker.status === 'occupied' ? 'border-warning-200 bg-warning-50' :
                'border-danger-200 bg-danger-50'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{getStatusIcon(locker.status)}</div>
                <h4 className="font-medium text-gray-900">{locker.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{locker.location}</p>
                <span className={`status-badge ${getStatusColor(locker.status)}`}>
                  {locker.status}
                </span>
                {locker.user && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{locker.user}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex space-x-4">
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add New Locker</span>
        </button>
        <button className="btn btn-secondary flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <span>View Analytics</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 