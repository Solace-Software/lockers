import React from 'react';
import { Input, Select, Button } from '../ui';

const LockerFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onlineFilter,
  onOnlineChange,
  groupFilter,
  onGroupChange,
  groups,
  onBulkUnlock,
  onAddLocker,
  onClearLockers,
  loading
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Search lockers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </Select>
        <Select
          value={onlineFilter}
          onChange={(e) => onOnlineChange(e.target.value)}
        >
          <option value="all">All Lockers</option>
          <option value="online">Online Only</option>
          <option value="offline">Offline Only</option>
        </Select>
        <Select
          value={groupFilter}
          onChange={(e) => onGroupChange(e.target.value)}
        >
          <option value="all">All Groups</option>
          <option value="ungrouped">Ungrouped</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="primary"
          onClick={onBulkUnlock}
          disabled={loading}
          className="bg-blueglass-500 text-black hover:bg-blueglass-400"
        >
          {loading ? 'Processing...' : 'Unlock All Online'}
        </Button>
        <Button
          variant="primary"
          onClick={onAddLocker}
        >
          Add Locker
        </Button>
        <Button
          variant="danger"
          onClick={onClearLockers}
        >
          Clear Lockers
        </Button>
      </div>
    </div>
  );
};

export default LockerFilters;