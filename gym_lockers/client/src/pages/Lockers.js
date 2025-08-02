import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Unlock, 
  RefreshCw,
  Wrench,
  Zap
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Lockers = () => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [editingLocker, setEditingLocker] = useState(null);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [bulkOperationResults, setBulkOperationResults] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    location: '', 
    doorip: '192.168.1.100',
    mqttTopic: 'rfid',
    lockNumber: 1
  });
  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    expiryDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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

      socket.on('user-updated', (updatedUser) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      });

      socket.on('bulk-operation-completed', (operationResult) => {
        setBulkOperationResults(operationResult);
        // Auto-hide after 10 seconds
        setTimeout(() => setBulkOperationResults(null), 10000);
      });
    }

    return () => {
      if (socket) {
        socket.off('locker-updated');
        socket.off('locker-added');
        socket.off('locker-deleted');
        socket.off('user-updated');
        socket.off('bulk-operation-completed');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [lockersRes, usersRes] = await Promise.all([
        axios.get('/api/lockers'),
        axios.get('/api/users')
      ]);
      
      setLockers(lockersRes.data);
      setUsers(usersRes.data);
      
      // Try to fetch groups if the endpoint exists
      try {
        const groupsRes = await axios.get('/api/locker-groups');
      setGroups(groupsRes.data);
      } catch (error) {
        // Ignore 404 errors for groups endpoint
        if (error.response?.status !== 404) {
          console.error('Error fetching groups:', error);
        }
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch lockers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocker = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/lockers', {
        name: formData.name,
        location: formData.location,
        doorip: formData.doorip,
        lockNumber: formData.lockNumber
      });
      setFormData({ name: '', location: '', doorip: '192.168.1.100', lockNumber: 1 });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding locker:', error);
    }
  };

  const handleUpdateLocker = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/lockers/${editingLocker.id}`, {
        name: formData.name
      });
      setFormData({ name: '', location: '', doorip: '192.168.1.100', lockNumber: 1 });
      setEditingLocker(null);
    } catch (error) {
      console.error('Error updating locker:', error);
    }
  };

  const handleDeleteLocker = async (id) => {
    if (window.confirm('Are you sure you want to delete this locker?')) {
      try {
        await axios.delete(`/api/lockers/${id}`);
      } catch (error) {
        console.error('Error deleting locker:', error);
      }
    }
  };

  const handleAssignLocker = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/lockers/${selectedLocker.id}/assign`, assignmentData);
      setAssignmentData({ userId: '', expiryDate: '' });
      setShowAssignModal(false);
      setSelectedLocker(null);
    } catch (error) {
      console.error('Error assigning locker:', error);
    }
  };

  const handleUnassignLocker = async (lockerId) => {
    if (window.confirm('Are you sure you want to unassign this locker?')) {
      try {
        await axios.post(`/api/lockers/${lockerId}/unassign`);
      } catch (error) {
        console.error('Error unassigning locker:', error);
      }
    }
  };

  const sendCommand = async (lockerId, command) => {
    try {
      await axios.post(`/api/lockers/${lockerId}/command`, { command });
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-success-600 bg-success-50';
      case 'occupied': return 'text-warning-600 bg-warning-50';
      case 'maintenance': return 'text-red-600 bg-red-50';
      case 'in-use': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const isLockerOnline = (locker) => {
    if (!locker.last_heartbeat) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(locker.last_heartbeat) > fiveMinutesAgo;
  };

  const getOnlineStatus = (locker) => {
    const online = isLockerOnline(locker);
    return {
      color: online ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50',
      text: online ? 'Online' : 'Offline',
      lastSeen: locker.last_heartbeat ? new Date(locker.last_heartbeat).toLocaleString() : 'Never'
    };
  };

  const getLockerGroup = (lockerId) => {
    return groups.find(group => group.locker_ids && group.locker_ids.includes(lockerId));
  };

  const filteredLockers = lockers.filter(locker => {
    const matchesSearch = locker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locker.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         locker.doorip.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || locker.status === statusFilter;
    const matchesOnline = onlineFilter === 'all' || 
                         (onlineFilter === 'online' && isLockerOnline(locker)) ||
                         (onlineFilter === 'offline' && !isLockerOnline(locker));
    const matchesGroup = groupFilter === 'all' || 
                        (groupFilter === 'ungrouped' && !getLockerGroup(locker.id)) ||
                        (groupFilter !== 'all' && groupFilter !== 'ungrouped' && getLockerGroup(locker.id)?.id === parseInt(groupFilter));
    return matchesSearch && matchesStatus && matchesOnline && matchesGroup;
  });

  const handleBulkUnlock = async () => {
    if (!window.confirm('Are you sure you want to unlock all online lockers?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post('/api/lockers/bulk-unlock', { onlineOnly: true });
      
      if (response.data.success) {
        const successful = response.data.results.length;
        const failed = response.data.errors.length;
        const total = successful + failed;
        
        toast.success(`Successfully initiated unlock for ${successful} out of ${total} lockers`);
        if (failed > 0) {
          toast.warning(`Failed to unlock ${failed} lockers`);
        }
      } else {
        toast.error(response.data.error || 'Failed to perform bulk unlock');
      }
    } catch (error) {
      console.error('Error performing bulk unlock:', error);
      toast.error(error.response?.data?.error || 'Failed to perform bulk unlock');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLockers = async () => {
    if (clearConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.delete('/api/lockers/clear');
      
      if (response.data.success) {
        toast.success(`Successfully cleared ${response.data.cleared} lockers`);
        // Clear local state
        setLockers([]);
        setSelectedLocker(null);
        setShowClearModal(false);
        setClearConfirmText('');
        // Fetch data after a short delay to allow for new heartbeats
        setTimeout(() => {
          fetchData();
        }, 5000);
      } else {
        throw new Error(response.data.error || 'Failed to clear lockers');
      }
    } catch (error) {
      console.error('Failed to clear lockers:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to clear lockers';
      const errorDetails = error.response?.data?.details ? `\n${error.response.data.details}` : '';
      toast.error(`Error: ${errorMessage}${errorDetails}`);
    } finally {
      setIsLoading(false);
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
        <h1 className="dashboard-header">Locker Management</h1>
        <p className="text-secondary mt-2">Manage and monitor all gym lockers</p>
      </div>

      {/* Bulk Operation Results */}
      {bulkOperationResults && (
        <div className="mb-6 p-4 dashboard-card">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                Bulk Operation Completed
              </h3>
              <p className="text-sm text-cyan-200 mt-1">
                Operation: {bulkOperationResults.operation} | 
                Successful: {bulkOperationResults.results.length} | 
                Failed: {bulkOperationResults.errors.length}
              </p>
              {bulkOperationResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-danger-400">Errors:</p>
                  <ul className="text-xs text-danger-400 mt-1">
                    {bulkOperationResults.errors.map((error, index) => (
                      <li key={index}>
                        {error.lockerName || error.lockerId}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search lockers..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            className="input"
            value={onlineFilter}
            onChange={(e) => setOnlineFilter(e.target.value)}
          >
            <option value="all">All Lockers</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          <select
            className="input"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="ungrouped">Ungrouped</option>
            {groups.map(group => (
              <option key={group.id} value={group.id} style={{ backgroundColor: group.color + '20' }}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBulkUnlock}
            disabled={loading}
            className="btn btn-warning"
          >
            {loading ? 'Processing...' : '🔓 Unlock All Online'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            Add Locker
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="btn btn-danger"
          >
            Clear Lockers
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {(searchTerm || statusFilter !== 'all' || onlineFilter !== 'all' || groupFilter !== 'all') && (
        <div className="mb-4 p-3 dashboard-card">
          <div className="flex items-center space-x-2 text-sm text-cyan-200">
            <span className="font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-200 rounded">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-success-500/20 text-success-400 rounded">
                Status: {statusFilter}
              </span>
            )}
            {onlineFilter !== 'all' && (
              <span className="px-2 py-1 bg-warning-500/20 text-warning-400 rounded">
                {onlineFilter === 'online' ? 'Online Only' : 'Offline Only'}
              </span>
            )}
            {groupFilter !== 'all' && (
              <span className="px-2 py-1 bg-blueglass-500/20 text-cyan-200 rounded">
                {groupFilter === 'ungrouped' ? 'Ungrouped' : `Group: ${groups.find(g => g.id === parseInt(groupFilter))?.name || 'Unknown'}`}
              </span>
            )}
            <span className="text-blueglass-200">
              ({filteredLockers.length} of {lockers.length} lockers)
            </span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="dashboard-card p-4">
          <h4 className="text-label">Total Lockers</h4>
          <p className="text-metric">{lockers.length}</p>
        </div>
        <div className="dashboard-card p-4">
          <h4 className="text-label">Online</h4>
          <p className="text-metric-cyan">
            {lockers.filter(l => isLockerOnline(l)).length}
          </p>
        </div>
        <div className="dashboard-card p-4">
          <h4 className="text-label">Offline</h4>
          <p className="text-metric">
            {lockers.filter(l => !isLockerOnline(l)).length}
          </p>
        </div>
        <div className="dashboard-card p-4">
          <h4 className="text-label">In Use</h4>
          <p className="text-metric-cyan">
            {lockers.filter(l => l.status === 'occupied').length}
          </p>
        </div>
        <div className="dashboard-card p-4">
          <h4 className="text-label">Grouped</h4>
          <p className="text-metric-cyan">
            {lockers.filter(l => getLockerGroup(l.id)).length}
          </p>
        </div>
      </div>

      {/* Lockers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLockers.map((locker) => {
          const assignedUser = users.find(u => u.locker_id === locker.id);
          const onlineStatus = getOnlineStatus(locker);
          return (
            <div key={locker.id} className={`dashboard-card ${locker.status === 'maintenance' ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-metric">{locker.name}</h3>
                  {locker.autoDiscovered && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-200 text-xs rounded font-medium">
                      Auto-discovered
                    </span>
                  )}
                  {locker.status === 'maintenance' && (
                    <span className="px-2 py-1 bg-danger-500/20 text-danger-400 text-xs rounded font-medium">
                      Maintenance
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`status-badge status-${locker.status}`}>{locker.status}</span>
                  <span className={`status-badge mt-1 ${onlineStatus.color}`} title={`Last seen: ${onlineStatus.lastSeen}`}>
                    {onlineStatus.text}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-label">Location</p>
                  <p className="text-secondary">{locker.location}</p>
                </div>

                {(() => {
                  const group = getLockerGroup(locker.id);
                  return group ? (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      ></div>
                      <div>
                        <p className="text-label">Group</p>
                        <p className="text-secondary">{group.name}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <div>
                  <p className="text-label">IP Address</p>
                  <p className="text-secondary">{locker.ip_address}</p>
                </div>
                <div>
                  <p className="text-label">Lock Number</p>
                  <p className="text-secondary">{locker.num_locks || 1}</p>
                </div>
                {locker.status === 'occupied' && assignedUser && (
                  <div>
                    <p className="text-label">Occupied By</p>
                    <button
                      className="text-cyan-200 underline text-sm font-medium hover:text-cyan-100"
                      onClick={() => navigate(`/users?userId=${assignedUser.id}`)}
                    >
                      {assignedUser.first_name} {assignedUser.last_name} ({assignedUser.email})
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => sendCommand(locker.id, 'openlock')}
                  className={`btn btn-success btn-sm flex items-center space-x-1 ${
                    locker.status === 'maintenance' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={locker.status === 'maintenance'}
                >
                  <Unlock className="w-3 h-3" />
                  <span>Manual Unlock</span>
                </button>
                <button
                  onClick={async () => {
                    const command = locker.status === 'maintenance' ? 'normal' : 'maintenance';
                    await axios.post(`/api/lockers/${locker.id}/command`, { command });
                    const action = command === 'maintenance' ? 'set to maintenance' : 'removed from maintenance';
                    toast.success(`Locker ${action}`);
                  }}
                  className={`btn btn-sm flex items-center space-x-1 ${
                    locker.status === 'maintenance' 
                      ? 'btn-success' 
                      : 'btn-warning'
                  }`}
                >
                  <Wrench className="w-3 h-3" />
                  <span>{locker.status === 'maintenance' ? 'Remove Maintenance' : 'Maintenance'}</span>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingLocker(locker);
                    setFormData({ 
                      name: locker.name, 
                      location: locker.location,
                      doorip: locker.ip_address,
                      lockNumber: locker.num_locks
                    });
                  }}
                  className="btn btn-secondary btn-sm flex-1 flex items-center justify-center space-x-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                
                <button
                  onClick={() => handleDeleteLocker(locker.id)}
                  className="btn btn-danger btn-sm flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Locker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-md border border-blueglass-700 shadow-glass rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">Add New Locker</h3>
            <form onSubmit={handleAddLocker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Locker Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Door IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.doorip}
                    onChange={(e) => setFormData({ ...formData, doorip: e.target.value })}
                    className="input"
                    required
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Lock Number
                  </label>
                  <input
                    type="text"
                    value={formData.lockNumber}
                    className="input bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Locker Modal */}
      {editingLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-md border border-blueglass-700 shadow-glass rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Locker</h3>
            <form onSubmit={handleUpdateLocker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Locker Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input text-gray-900 bg-white border border-gray-300 focus:border-primary-500 focus:ring-primary-500 placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    className="input bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Door IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.doorip}
                    className="input bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1">
                    Lock Number
                  </label>
                  <input
                    type="text"
                    value={formData.lockNumber}
                    className="input bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingLocker(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Update Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Locker Modal */}
      {showAssignModal && selectedLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-md border border-blueglass-700 shadow-glass rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Locker: {selectedLocker.name}
            </h3>
            <form onSubmit={handleAssignLocker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    value={assignmentData.userId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, userId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Choose a user...</option>
                    {users
                      .filter(user => !user.lockerId) // Only show unassigned users
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.phone})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignmentData.expiryDate}
                    onChange={(e) => setAssignmentData({ ...assignmentData, expiryDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedLocker(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Assign Locker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Clear Lockers Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/50 backdrop-blur-md border border-blueglass-700 shadow-glass rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🗑️</span> Clear All Lockers
            </h3>
            <div className="flex items-center bg-warning-100 border-l-4 border-warning-500 p-3 rounded mb-4">
              <span className="text-warning-600 text-xl mr-3">⚠️</span>
              <span className="text-warning-800 text-sm font-medium">
                This will <span className="font-bold">remove all lockers</span> from the system.<br />
                New lockers will be created automatically when heartbeats are received.
              </span>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-cyan-200 mb-2">
                Type <span className="font-mono bg-gray-900 text-cyan-300 px-1 rounded">DELETE</span> in capitals to confirm
              </label>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="input"
                placeholder="DELETE"
                autoFocus
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmText('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLockers}
                className={`btn btn-danger flex-1 font-semibold shadow transition-all duration-150 ${clearConfirmText !== 'DELETE' ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={clearConfirmText !== 'DELETE'}
              >
                <span className="flex items-center"><span className="mr-2">🗑️</span> Clear All Lockers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lockers; 