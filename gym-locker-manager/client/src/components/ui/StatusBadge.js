import React from 'react';
import classNames from 'classnames';

const StatusBadge = ({ 
  status,
  text,
  className,
  ...props 
}) => {
  const statusClasses = {
    success: 'bg-app-status-success-bg text-app-status-success-text border-app-status-success-border',
    warning: 'bg-app-status-warning-bg text-app-status-warning-text border-app-status-warning-border',
    error: 'bg-app-status-error-bg text-app-status-error-text border-app-status-error-border',
    info: 'bg-app-status-info-bg text-app-status-info-text border-app-status-info-border',
  };

  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-1',
        'text-sm font-medium',
        'rounded-lg border',
        statusClasses[status],
        className
      )}
      {...props}
    >
      {text}
    </span>
  );
};

export default StatusBadge;