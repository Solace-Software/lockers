import React from 'react';

const DashboardCard = ({ children, className = '' }) => (
  <div className={`dashboard-card ${className}`}>
    {children}
  </div>
);

export default DashboardCard; 