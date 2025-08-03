import React from 'react';
import { Card } from '../ui';

const StatCard = ({ label, value, variant = 'default' }) => {
  const valueColorClass = variant === 'primary' ? 'text-app-blue' : 'text-app-text-primary';

  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium text-app-text-tertiary">{label}</h4>
      <p className={`text-2xl font-semibold mt-1 ${valueColorClass}`}>{value}</p>
    </Card>
  );
};

const LockerStats = ({ lockers, isLockerOnline, getLockerGroup }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <StatCard
        label="Total Lockers"
        value={lockers.length}
      />
      <StatCard
        label="Online"
        value={lockers.filter(l => isLockerOnline(l)).length}
        variant="primary"
      />
      <StatCard
        label="Offline"
        value={lockers.filter(l => !isLockerOnline(l)).length}
      />
      <StatCard
        label="In Use"
        value={lockers.filter(l => l.status === 'occupied').length}
        variant="primary"
      />
      <StatCard
        label="Grouped"
        value={lockers.filter(l => getLockerGroup(l.id)).length}
        variant="primary"
      />
    </div>
  );
};

export default LockerStats;