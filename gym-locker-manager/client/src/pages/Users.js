import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Lock, Mail, Phone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Card, Button, Input, Table, Icon, StatusBadge } from '../components/ui';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [lockers, setLockers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rfid: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, lockersRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/lockers')
      ]);
      setUsers(usersRes.data);
      setLockers(lockersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch users data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
        toast.success('User updated successfully');
      } else {
        await axios.post('/api/users', formData);
        toast.success('User created successfully');
      }
      setShowAddModal(false);
      setEditingUser(null);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', rfid: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchString = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchString) ||
      user.last_name.toLowerCase().includes(searchString) ||
      user.email.toLowerCase().includes(searchString) ||
      user.phone.includes(searchString)
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-app-text-primary">Users</h1>
          <p className="text-app-text-secondary mt-1">Manage gym members and their locker assignments</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          icon={<Icon icon={Plus} size="sm" />}
        >
          Add User
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <p className="text-app-text-tertiary">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
          const assignedLocker = lockers.find(l => l.id === user.locker_id);
          
          return (
            <Card key={user.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-app-blue/10 rounded-lg flex items-center justify-center">
                    <Icon icon={User} className="text-app-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-app-text-primary">
                      {user.first_name} {user.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Icon icon={Mail} size="sm" className="text-app-text-tertiary" />
                      <p className="text-app-text-secondary text-sm">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon={Edit2} size="sm" />}
                    onClick={() => {
                      setEditingUser(user);
                      setFormData({
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        rfid: user.rfid
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
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon icon={Phone} size="sm" className="text-app-text-tertiary" />
                  <p className="text-app-text-secondary text-sm">{user.phone}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon icon={Lock} size="sm" className="text-app-text-tertiary" />
                  <p className="text-app-text-secondary text-sm">
                    {assignedLocker ? (
                      <>
                        Assigned to locker: <span className="font-medium">{assignedLocker.name}</span>
                      </>
                    ) : (
                      'No locker assigned'
                    )}
                  </p>
                </div>
                {user.rfid && (
                  <StatusBadge
                    status="info"
                    text={`RFID: ${user.rfid}`}
                  />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-app-text-primary mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <Input
                  label="RFID Tag (Optional)"
                  value={formData.rfid}
                  onChange={(e) => setFormData({ ...formData, rfid: e.target.value })}
                  placeholder="Enter RFID tag number"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                    setFormData({ first_name: '', last_name: '', email: '', phone: '', rfid: '' });
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
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Users;