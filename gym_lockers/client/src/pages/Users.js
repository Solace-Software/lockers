import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Phone,
  User,
  RefreshCw,
  Unlock,
  Clock,
  MapPin
} from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardCard from '../components/DashboardCard';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [lockers, setLockers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Form states
  const [formData, setFormData] = useState({ 
    first_name: '',
    last_name: '',
    email: '',
    gym_id: '',
    phone: '', 
    role: 'user',
    rfid_tag: '',
  });

  const [rfidValidation, setRfidValidation] = useState({
    isChecking: false,
    isAvailable: null,
    message: ''
  });
  
  const [lockerExpiryHours, setLockerExpiryHours] = useState(24);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, lockersRes, groupsRes, expiryRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/lockers'),
        axios.get('/api/groups'),
        axios.get('/api/settings/locker-expiry')
      ]);
      setUsers(usersRes.data);
      setLockers(lockersRes.data);
      setGroups(groupsRes.data);
      setLockerExpiryHours(expiryRes.data.lockerExpiryHours);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/users', formData);
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setFormData({ first_name: '', last_name: '', email: '', gym_id: '', phone: '', role: 'user', rfid_tag: '' });
      setRfidValidation({ isChecking: false, isAvailable: null, message: '' });
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.data?.error?.includes('RFID tag')) {
        toast.error(error.response.data.error);
        setRfidValidation({ isChecking: false, isAvailable: false, message: error.response.data.error });
      } else {
        toast.error(error.response?.data?.error || 'Failed to create user');
      }
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/users/${selectedUser.id}`, formData);
      setUsers(users.map(user => user.id === selectedUser.id ? response.data : user));
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ first_name: '', last_name: '', email: '', gym_id: '', phone: '', role: 'user', rfid_tag: '' });
      setRfidValidation({ isChecking: false, isAvailable: null, message: '' });
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.data?.error?.includes('RFID tag')) {
        toast.error(error.response.data.error);
        setRfidValidation({ isChecking: false, isAvailable: false, message: error.response.data.error });
      } else {
        toast.error(error.response?.data?.error || 'Failed to update user');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
      try {
      await axios.delete(`/api/users/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleAssignRandomLocker = async () => {
    try {
      const availableLockers = lockers.filter(locker => 
        locker.status === 'available' && 
        (selectedGroup === 'all' || 
         groups.find(g => g.id === parseInt(selectedGroup))?.locker_ids?.includes(locker.id))
      );

      if (availableLockers.length === 0) {
        toast.error('No available lockers in the selected group');
        return;
      }

      const randomLocker = availableLockers[Math.floor(Math.random() * availableLockers.length)];
      
      const response = await axios.post(`/api/lockers/${randomLocker.id}/assign`, {
        userId: selectedUser.id,
        expiryDate: new Date(Date.now() + lockerExpiryHours * 60 * 60 * 1000).toISOString()
      });

      // Update lockers list
      setLockers(lockers.map(locker => 
        locker.id === randomLocker.id ? response.data : locker
      ));

      // Update users list
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, locker_id: randomLocker.id } : user
      ));

      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedGroup('all');
      toast.success(`Assigned locker ${randomLocker.name} to ${selectedUser.first_name} ${selectedUser.last_name}`);
    } catch (error) {
      console.error('Error assigning locker:', error);
      toast.error(error.response?.data?.error || 'Failed to assign locker');
    }
  };

  const handleUnassignLocker = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const userLocker = lockers.find(l => l.id === user.locker_id);
      
      if (!userLocker) {
        toast.error('No locker assigned to this user');
        return;
      }

      // Unassign locker and trigger unlock
      const response = await axios.post(`/api/lockers/${userLocker.id}/unassign`);
      
      // Update lockers list
      setLockers(lockers.map(locker => 
        locker.id === userLocker.id ? response.data : locker
      ));

      // Update users list
      setUsers(users.map(u => 
        u.id === userId ? { ...u, locker_id: null } : u
      ));

      toast.success(`Unassigned locker ${userLocker.name} from ${user.first_name} ${user.last_name} and unlocked it`);
    } catch (error) {
      console.error('Error unassigning locker:', error);
      toast.error(error.response?.data?.error || 'Failed to unassign locker');
    }
  };

  const handleUnlockLocker = async (userId) => {
    const user = users.find(u => u.id === userId);
    const userLocker = lockers.find(l => l.id === user.locker_id);
    if (!userLocker) {
      toast.error('No locker assigned to this user');
      return;
    }
    try {
      await axios.post(`/api/lockers/${userLocker.id}/command`, { command: 'openlock' });
      toast.success(`Locker ${userLocker.name} unlocked`);
    } catch (error) {
      console.error('Error unlocking locker:', error);
      toast.error(error.response?.data?.error || 'Failed to unlock locker');
    }
  };

  const fetchUserLogs = async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/logs`);
      setUserLogs(response.data);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Error fetching user logs:', error);
      toast.error('Failed to fetch user logs');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      gym_id: user.gym_id || '',
      phone: user.phone || '',
      role: user.role || 'user',
      rfid_tag: user.rfid_tag || '',
    });
    setRfidValidation({ isChecking: false, isAvailable: null, message: '' });
    setShowEditModal(true);
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    setShowAssignModal(true);
  };

  const getAssignedLocker = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.locker_id) return null;
    return lockers.find(l => l.id === user.locker_id);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.gym_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rfid_tag?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Add RFID tag validation function
  const validateRfidTag = async (tag) => {
    if (!tag || tag.trim() === '') {
      setRfidValidation({ isChecking: false, isAvailable: null, message: '' });
      return;
    }
    
    setRfidValidation({ isChecking: true, isAvailable: null, message: 'Checking...' });
    
    try {
      const response = await axios.get(`/api/rfid/check/${tag.trim()}`);
      const isAvailable = response.data.available;
      
      setRfidValidation({
        isChecking: false,
        isAvailable,
        message: isAvailable ? 'RFID tag is available' : 'RFID tag is already assigned'
      });
    } catch (error) {
      setRfidValidation({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking RFID tag'
      });
    }
  };

  // Update RFID tag input with validation
  const handleRfidTagChange = (e) => {
    const tag = e.target.value;
    setFormData({ ...formData, rfid_tag: tag });
    
    // Debounce validation
    clearTimeout(rfidValidation.timeout);
    const timeout = setTimeout(() => validateRfidTag(tag), 500);
    setRfidValidation(prev => ({ ...prev, timeout }));
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
      <DashboardHeader title="User Management" subtitle="Manage gym members and their locker assignments" />

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="primary" className="flex items-center space-x-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const assignedLocker = getAssignedLocker(user.id);
          return (
            <DashboardCard key={user.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-sm text-cyan-200">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="secondary" className="text-cyan-200 hover:text-white" onClick={() => openEditModal(user)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="danger" className="text-danger-400 hover:text-white" onClick={() => handleDeleteUser(user.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200">Gym ID:</span>
                  <span className="font-medium text-white">{user.gym_id || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200">Phone:</span>
                  <span className="font-medium text-white">{user.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200">Locker:</span>
                  <span className={`font-medium ${assignedLocker ? 'text-success-400' : 'text-cyan-200'}`}>{assignedLocker ? assignedLocker.name : 'Not assigned'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200">RFID Tag:</span>
                  <span className="font-medium text-white">{user.rfid_tag || 'Not set'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="success" className="flex items-center space-x-1" onClick={() => openAssignModal(user)}>
                  <Key className="w-3 h-3" />
                  <span>Assign Locker</span>
                </Button>
                
                {assignedLocker && (
                  <Button variant="warning" className="flex items-center space-x-1" onClick={() => handleUnassignLocker(user.id)}>
                    <Unlock className="w-3 h-3" />
                    <span>Unassign Locker</span>
                  </Button>
                )}
                {assignedLocker && (
                  <Button variant="success" className="flex items-center space-x-1" onClick={() => handleUnlockLocker(user.id)}>
                    <Unlock className="w-3 h-3" />
                    <span>Unlock Locker</span>
                  </Button>
                )}
                        
                <Button variant="info" className="flex items-center space-x-1" onClick={() => fetchUserLogs(user.id)}>
                  <Clock className="w-3 h-3" />
                  <span>Logs</span>
                </Button>
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Add User Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <h2 className="text-xl font-bold mb-4 text-white">Add User</h2>
        <form onSubmit={handleAddUser}>
          <div className="space-y-4">
            <Input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
            <Input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <Input type="text" placeholder="Gym ID" value={formData.gym_id} onChange={(e) => setFormData({...formData, gym_id: e.target.value})} />
            <Input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <select className="input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Input type="text" placeholder="RFID Tag" value={formData.rfid_tag} onChange={handleRfidTagChange} />
            <Button variant="primary" type="submit">Add User</Button>
            <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <h2 className="text-xl font-bold mb-4 text-white">Edit User</h2>
        <form onSubmit={handleUpdateUser}>
          <div className="space-y-4">
            <Input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
            <Input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <Input type="text" placeholder="Gym ID" value={formData.gym_id} onChange={(e) => setFormData({...formData, gym_id: e.target.value})} />
            <Input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <select className="input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <Input type="text" placeholder="RFID Tag" value={formData.rfid_tag} onChange={handleRfidTagChange} />
            <Button variant="primary" type="submit">Update User</Button>
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <h2 className="text-xl font-bold mb-4 text-white">Assign Locker</h2>
        <div className="space-y-4">
          <select className="input" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <Button variant="success" onClick={handleAssignRandomLocker}>Assign Random Locker</Button>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* User Logs Modal */}
      {showLogsModal && (
        <Modal open={showLogsModal} onClose={() => setShowLogsModal(false)}>
          <h2 className="text-xl font-semibold">
            Activity Logs for {selectedUser?.first_name} {selectedUser?.last_name}
          </h2>
          {userLogs.length > 0 ? (
            <div className="space-y-3">
              {userLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-600">
                        {log.details?.locker_name || 'Unknown locker'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {log.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      {log.details.start_time && log.details.end_time && (
                        <p>
                          Duration: {new Date(log.details.start_time).toLocaleString()} - 
                          {new Date(log.details.end_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No activity logs found for this user.</p>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Users; 