import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card, Button, Input, Table, Icon } from '../components/ui';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196F3'
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/locker-groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await axios.put(`/api/locker-groups/${editingGroup.id}`, formData);
        toast.success('Group updated successfully');
      } else {
        await axios.post('/api/locker-groups', formData);
        toast.success('Group created successfully');
      }
      setShowAddModal(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '', color: '#2196F3' });
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group');
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    
    try {
      await axios.delete(`/api/locker-groups/${groupId}`);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-app-text-primary">Locker Groups</h1>
          <p className="text-app-text-secondary mt-1">Manage and organize lockers into groups</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          icon={<Icon icon={Plus} size="sm" />}
        >
          Add Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <Card key={group.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: group.color }}
                >
                  <Icon icon={Users} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-app-text-primary">{group.name}</h3>
                  <p className="text-app-text-secondary text-sm">{group.description}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Icon icon={Edit2} size="sm" />}
                  onClick={() => {
                    setEditingGroup(group);
                    setFormData({
                      name: group.name,
                      description: group.description,
                      color: group.color
                    });
                    setShowAddModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Icon icon={Trash2} size="sm" />}
                  onClick={() => handleDelete(group.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-app-text-tertiary">Lockers</p>
              <p className="text-app-text-secondary">
                {group.locker_ids?.length || 0} lockers in this group
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-app-text-primary mb-4">
              {editingGroup ? 'Edit Group' : 'Add New Group'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="Group Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium text-app-text-primary mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingGroup(null);
                    setFormData({ name: '', description: '', color: '#2196F3' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Groups;