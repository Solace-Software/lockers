import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Lock, 
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import axios from 'axios';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [analyticsRes, lockersRes] = await Promise.all([
        axios.get('/api/analytics/usage'),
        axios.get('/api/lockers')
      ]);
      setAnalytics(analyticsRes.data);
      setLockers(lockersRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for charts (in production, this would come from the backend)
  const statusData = [
    { name: 'Available', value: analytics.available || 0, color: '#22c55e' },
    { name: 'Occupied', value: analytics.occupied || 0, color: '#f59e0b' },
    { name: 'Maintenance', value: analytics.maintenance || 0, color: '#ef4444' },
  ];

  const locationData = [
    { location: 'Men\'s Locker Room', available: 2, occupied: 1, maintenance: 1 },
    { location: 'Women\'s Locker Room', available: 1, occupied: 1, maintenance: 0 },
  ];

  const usageData = [
    { day: 'Mon', usage: 65 },
    { day: 'Tue', usage: 72 },
    { day: 'Wed', usage: 68 },
    { day: 'Thu', usage: 75 },
    { day: 'Fri', usage: 80 },
    { day: 'Sat', usage: 85 },
    { day: 'Sun', usage: 70 },
  ];

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights into locker usage and performance</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              timeRange === '24h' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              timeRange === '7d' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              timeRange === '30d' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Days
          </button>
        </div>

        <button className="btn btn-secondary flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.utilization || 0}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <Activity className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">24h Usage</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.usage24h || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">7d Usage</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.usage7d || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <Lock className="w-6 h-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.maintenance || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Locker Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Locker Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Usage Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="usage" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Usage %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location-based Analytics */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Locker Usage by Location</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={locationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="available" fill="#22c55e" name="Available" />
            <Bar dataKey="occupied" fill="#f59e0b" name="Occupied" />
            <Bar dataKey="maintenance" fill="#ef4444" name="Maintenance" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Lockers</h3>
          <div className="space-y-3">
            {lockers
              .filter(locker => locker.lastUsed)
              .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
              .slice(0, 5)
              .map((locker, index) => (
                <div key={locker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{locker.name}</p>
                      <p className="text-xs text-gray-500">{locker.location}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(locker.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {lockers
              .filter(locker => locker.lastUsed)
              .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
              .slice(0, 5)
              .map((locker) => (
                <div key={locker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{locker.name}</p>
                    <p className="text-xs text-gray-500">
                      Status: <span className={`status-badge ${locker.status === 'occupied' ? 'text-warning-600 bg-warning-50' : 'text-success-600 bg-success-50'}`}>
                        {locker.status}
                      </span>
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(locker.lastUsed).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 