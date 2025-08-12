import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card, Button, Input } from '../components/ui';
import { LockerCard, LockerFilters, LockerStats } from '../components/locker';

const Lockers = () => {
  const { socket, isConnected } = useSocket();
  const [lockers, setLockers] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [editingLocker, setEditingLocker] = useState(null);
  const [bulkOperationResults, setBulkOperationResults] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    doorip: '192.168.1.100',
    lockNumber: 1
  });

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
      
      try {
        const groupsRes = await axios.get('/api/locker-groups');
        setGroups(groupsRes.data);
      } catch (error) {
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
      toast.error('Failed to add locker');
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
      toast.success('Locker updated successfully');
    } catch (error) {
      console.error('Error updating locker:', error);
      toast.error('Failed to update locker');
    }
  };

  const handleDeleteLocker = async (id) => {
    if (window.confirm('Are you sure you want to delete this locker?')) {
      try {
        await axios.delete(`/api/lockers/${id}`);
        toast.success('Locker deleted successfully');
      } catch (error) {
        console.error('Error deleting locker:', error);
        toast.error('Failed to delete locker');
      }
    }
  };

  const sendCommand = async (lockerId, command) => {
    try {
      await axios.post(`/api/lockers/${lockerId}/command`, { command });
      toast.success(`Command ${command} sent successfully`);
    } catch (error) {
      console.error('Error sending command:', error);
      toast.error('Failed to send command');
    }
  };

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
    
    try {
      setLoading(true);
      const response = await axios.delete('/api/lockers/clear');
      
      if (response.data.success) {
        toast.success(`Successfully cleared ${response.data.cleared} lockers`);
        setLockers([]);
        setShowClearModal(false);
        setClearConfirmText('');
        setTimeout(fetchData, 5000);
      } else {
        throw new Error(response.data.error || 'Failed to clear lockers');
      }
    } catch (error) {
      console.error('Failed to clear lockers:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to clear lockers';
      const errorDetails = error.response?.data?.details ? `\n${error.response.data.details}` : '';
      toast.error(`Error: ${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-app-blue" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-app-text-primary">Locker Management</h1>
        <p className="text-app-text-secondary mt-2">Manage and monitor all gym lockers</p>
      </div>

      {bulkOperationResults && (
        <Card className="mb-6">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-app-blue mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-app-text-primary">
                Bulk Operation Completed
              </h3>
              <p className="text-sm text-app-text-secondary mt-1">
                Operation: {bulkOperationResults.operation} | 
                Successful: {bulkOperationResults.results.length} | 
                Failed: {bulkOperationResults.errors.length}
              </p>
              {bulkOperationResults.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-app-status-error-text">Errors:</p>
                  <ul className="text-xs text-app-status-error-text mt-1">
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
        </Card>
      )}

      <LockerFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onlineFilter={onlineFilter}
        onOnlineChange={setOnlineFilter}
        groupFilter={groupFilter}
        onGroupChange={setGroupFilter}
        groups={groups}
        onBulkUnlock={handleBulkUnlock}
        onAddLocker={() => setShowAddModal(true)}
        onClearLockers={() => setShowClearModal(true)}
        loading={loading}
      />

      <LockerStats
        lockers={lockers}
        isLockerOnline={isLockerOnline}
        getLockerGroup={getLockerGroup}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLockers.map((locker) => {
          const assignedUser = users.find(u => u.locker_id === locker.id);
          const onlineStatus = getOnlineStatus(locker);
          const group = getLockerGroup(locker.id);
          
          return (
            <LockerCard
              key={locker.id}
              locker={locker}
              assignedUser={assignedUser}
              onlineStatus={onlineStatus}
              group={group}
              onUnlock={() => sendCommand(locker.id, 'openlock')}
              onMaintenanceToggle={async () => {
                const command = locker.status === 'maintenance' ? 'normal' : 'maintenance';
                await sendCommand(locker.id, command);
              }}
              onEdit={() => {
                setEditingLocker(locker);
                setFormData({
                  name: locker.name,
                  location: locker.location,
                  doorip: locker.ip_address,
                  lockNumber: locker.num_locks
                });
              }}
              onDelete={() => handleDeleteLocker(locker.id)}
            />
          );
        })}
      </div>

      {/* Add Locker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-app-text-primary mb-4">Add New Locker</h3>
            <form onSubmit={handleAddLocker}>
              <div className="space-y-4">
                <Input
                  label="Locker Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
                <Input
                  label="Door IP Address"
                  value={formData.doorip}
                  onChange={(e) => setFormData({ ...formData, doorip: e.target.value })}
                  required
                  placeholder="192.168.1.100"
                />
                <Input
                  label="Lock Number"
                  value={formData.lockNumber}
                  readOnly
                  disabled
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Add Locker
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Locker Modal */}
      {editingLocker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-app-text-primary mb-4">Edit Locker</h3>
            <form onSubmit={handleUpdateLocker}>
              <div className="space-y-4">
                <Input
                  label="Locker Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Location"
                  value={formData.location}
                  disabled
                />
                <Input
                  label="Door IP Address"
                  value={formData.doorip}
                  disabled
                />
                <Input
                  label="Lock Number"
                  value={formData.lockNumber}
                  disabled
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setEditingLocker(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Update Locker
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Clear Lockers Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-app-text-primary mb-4">
              Clear All Lockers
            </h3>
            <div className="bg-app-status-warning-bg border-l-4 border-app-status-warning-border p-3 rounded mb-4">
              <p className="text-app-status-warning-text text-sm">
                <strong>Warning:</strong> This will remove all lockers from the system.
                New lockers will be created automatically when heartbeats are received.
              </p>
            </div>
            <Input
              label={<>Type <code className="bg-app-bg-tertiary px-2 py-1 rounded text-app-blue">DELETE</code> to confirm</>}
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmText('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleClearLockers}
                disabled={clearConfirmText !== 'DELETE'}
                className="flex-1"
              >
                Clear All Lockers
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Lockers;