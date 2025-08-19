import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Unlock, 
  Search,
  RefreshCw,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import DashboardHeader from '../components/DashboardHeader';
import DashboardCard from '../components/DashboardCard';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';

const Groups = () => {
  const { socket } = useSocket();
  const [groups, setGroups] = useState([]);
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedLockers, setSelectedLockers] = useState([]);
  const [bulkOperationResults, setBulkOperationResults] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('locker-group-added', (newGroup) => {
        setGroups(prev => [...prev, newGroup]);
      });

      socket.on('locker-group-updated', (updatedGroup) => {
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
      });

      socket.on('locker-group-deleted', (deletedGroup) => {
        setGroups(prev => prev.filter(g => g.id !== deletedGroup.id));
      });

      socket.on('bulk-operation-completed', (operationResult) => {
        setBulkOperationResults(operationResult);
        // Auto-hide after 10 seconds
        setTimeout(() => setBulkOperationResults(null), 10000);
      });
    }

    return () => {
      if (socket) {
        socket.off('locker-group-added');
        socket.off('locker-group-updated');
        socket.off('locker-group-deleted');
        socket.off('bulk-operation-completed');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [groupsRes, lockersRes] = await Promise.all([
        axios.get('/api/locker-groups'),
        axios.get('/api/lockers')
      ]);
      setGroups(groupsRes.data);
      setLockers(lockersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/locker-groups', {
        ...formData,
        locker_ids: selectedLockers
      });
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setSelectedLockers([]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding group:', error);
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/locker-groups/${editingGroup.id}`, {
        ...formData,
        locker_ids: selectedLockers
      });
      setFormData({ name: '', description: '', color: '#3B82F6' });
      setSelectedLockers([]);
      setEditingGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
      alert(error.response?.data?.error || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await axios.delete(`/api/locker-groups/${id}`);
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group');
      }
    }
  };

  const handleBulkOperation = async (groupId, operation) => {
    try {
      let endpoint;
      let payload = {};
      
      switch (operation) {
        case 'unlock':
          endpoint = `/api/locker-groups/${groupId}/bulk-unlock`;
          break;
        case 'maintenance':
          endpoint = `/api/locker-groups/${groupId}/bulk-maintenance`;
          payload = { enable: true };
          break;
        case 'normal':
          endpoint = `/api/locker-groups/${groupId}/bulk-maintenance`;
          payload = { enable: false };
          break;
        default:
          throw new Error('Unknown operation');
      }
      
      const response = await axios.post(endpoint, payload);
      console.log('Bulk operation result:', response.data);
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      alert(error.response?.data?.error || 'Failed to perform bulk operation');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setSelectedLockers([]);
    setShowAddModal(true);
  };

  const openEditModal = (group) => {
    setFormData({
      name: group.name,
      description: group.description,
      color: group.color
    });
    setSelectedLockers(Array.isArray(group.locker_ids) ? group.locker_ids : []);
    setEditingGroup(group);
  };

  const toggleLockerSelection = (lockerId) => {
    setSelectedLockers(prev => 
      prev.includes(lockerId) 
        ? prev.filter(id => id !== lockerId)
        : [...prev, lockerId]
    );
  };

  const getGroupLockers = (group) => {
    const lockerIds = Array.isArray(group.locker_ids) ? group.locker_ids : [];
    return lockers.filter(locker => lockerIds.includes(locker.id));
  };

  const getAvailableLockers = () => {
    const usedLockerIds = new Set();
    groups.forEach(group => {
      if (editingGroup && group.id === editingGroup.id) return; // Skip current group when editing
      const lockerIds = Array.isArray(group.locker_ids) ? group.locker_ids : [];
      lockerIds.forEach(id => usedLockerIds.add(id));
    });
    return lockers.filter(locker => !usedLockerIds.has(locker.id));
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <DashboardHeader title="Locker Groups" subtitle="Organize lockers into groups for bulk management" />

      {/* Bulk Operation Results */}
      {bulkOperationResults && (
        <DashboardCard className="mb-6 p-4">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                Bulk Operation Completed: {bulkOperationResults.groupName}
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
            <Button variant="secondary" className="text-cyan-200 hover:text-white" onClick={() => setBulkOperationResults(null)}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </DashboardCard>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
            <Input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>
        <Button variant="primary" className="flex items-center space-x-2" onClick={openAddModal}>
          <Plus className="w-5 h-5" />
          <span>New Group</span>
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const groupLockers = getGroupLockers(group);
          const availableCount = groupLockers.filter(l => l.status === 'available').length;
          const occupiedCount = groupLockers.filter(l => l.status === 'occupied').length;
          
          return (
            <DashboardCard key={group.id}>
              {/* Group Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  ></div>
                  <div>
                    <h3 className="font-semibold text-white">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-cyan-200">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" className="text-cyan-200 hover:text-white" onClick={() => openEditModal(group)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="danger" className="text-danger-400 hover:text-white" onClick={() => handleDeleteGroup(group.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Group Stats */}
              <div className="flex items-center space-x-4 mb-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200">{groupLockers.length} lockers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-400" />
                  <span className="text-success-200">{availableCount} available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-warning-400" />
                  <span className="text-warning-200">{occupiedCount} occupied</span>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="success" className="flex items-center justify-center space-x-2" onClick={() => handleBulkOperation(group.id, 'unlock')}>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock All</span>
                </Button>
                <Button variant="warning" className="flex items-center justify-center space-x-2" onClick={() => {
                  const maintenanceCount = groupLockers.filter(l => l.status === 'maintenance').length;
                  const operation = maintenanceCount > 0 ? 'normal' : 'maintenance';
                  handleBulkOperation(group.id, operation);
                }}>
                  <Wrench className="w-4 h-4" />
                  <span>
                    {groupLockers.some(l => l.status === 'maintenance') 
                      ? 'Remove Maintenance' 
                      : 'Maintenance'
                    }
                  </span>
                </Button>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No groups found</h3>
          <p className="text-cyan-200 mb-6">Create your first locker group to get started</p>
          <Button variant="primary" className="inline-flex items-center space-x-2" onClick={openAddModal}>
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAddModal || editingGroup} onClose={() => { setShowAddModal(false); setEditingGroup(null); }}>
        <h2 className="text-xl font-bold mb-4 text-white">
          {editingGroup ? 'Edit Group' : 'Create New Group'}
        </h2>
        <form onSubmit={editingGroup ? handleUpdateGroup : handleAddGroup}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Group Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Description
              </label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Color
              </label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-16 h-10 p-0 border-none bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-200 mb-1">
                Lockers
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {getAvailableLockers().concat(editingGroup ? getGroupLockers(editingGroup) : []).map(locker => (
                  <label key={locker.id} className="flex items-center space-x-2 text-cyan-200">
                    <input
                      type="checkbox"
                      checked={selectedLockers.includes(locker.id)}
                      onChange={() => toggleLockerSelection(locker.id)}
                      className="form-checkbox accent-cyan-400"
                    />
                    <span>{locker.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => { setShowAddModal(false); setEditingGroup(null); }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Groups; 