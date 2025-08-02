import React from 'react';

const DashboardHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h1 className="dashboard-header">{title}</h1>
    {subtitle && <p className="text-secondary mt-2">{subtitle}</p>}
  </div>
);

export default DashboardHeader; 