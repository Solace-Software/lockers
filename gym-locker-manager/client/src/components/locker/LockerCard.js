import React from 'react';
import { Edit, Trash2, Unlock, Wrench } from 'lucide-react';
import { Card, Button, StatusBadge } from '../ui';
import { useNavigate } from 'react-router-dom';

const LockerCard = ({
  locker,
  assignedUser,
  onlineStatus,
  group,
  onUnlock,
  onMaintenanceToggle,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <Card className={locker.status === 'maintenance' ? 'opacity-50' : ''}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-app-text-primary">{locker.name}</h3>
          {locker.autoDiscovered && (
            <StatusBadge
              status="info"
              text="Auto-discovered"
            />
          )}
          {locker.status === 'maintenance' && (
            <StatusBadge
              status="error"
              text="Maintenance"
            />
          )}
        </div>
        <div className="flex flex-col items-end">
          <StatusBadge
            status={locker.status === 'available' ? 'success' : 
                    locker.status === 'occupied' ? 'warning' : 
                    locker.status === 'maintenance' ? 'error' : 'info'}
            text={locker.status}
          />
          <StatusBadge
            status={onlineStatus.text === 'Online' ? 'success' : 'error'}
            text={onlineStatus.text}
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm font-medium text-app-text-tertiary">Location</p>
          <p className="text-app-text-secondary">{locker.location}</p>
        </div>

        {group && (
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <div>
              <p className="text-sm font-medium text-app-text-tertiary">Group</p>
              <p className="text-app-text-secondary">{group.name}</p>
            </div>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-app-text-tertiary">IP Address</p>
          <p className="text-app-text-secondary">{locker.ip_address}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-app-text-tertiary">Lock Number</p>
          <p className="text-app-text-secondary">{locker.num_locks || 1}</p>
        </div>

        {locker.status === 'occupied' && assignedUser && (
          <div>
            <p className="text-sm font-medium text-app-text-tertiary">Occupied By</p>
            <button
              className="text-app-blue hover:text-app-blue-dark text-sm font-medium"
              onClick={() => navigate(`/users?userId=${assignedUser.id}`)}
            >
              {assignedUser.first_name} {assignedUser.last_name} ({assignedUser.email})
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="success"
          size="sm"
          icon={<Unlock className="w-3 h-3" />}
          onClick={onUnlock}
          disabled={locker.status === 'maintenance'}
        >
          Manual Unlock
        </Button>
        <Button
          variant={locker.status === 'maintenance' ? 'success' : 'warning'}
          size="sm"
          icon={<Wrench className="w-3 h-3" />}
          onClick={onMaintenanceToggle}
        >
          {locker.status === 'maintenance' ? 'Remove Maintenance' : 'Maintenance'}
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Edit className="w-3 h-3" />}
          onClick={onEdit}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 className="w-3 h-3" />}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default LockerCard;