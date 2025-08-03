import React from 'react';
import classNames from 'classnames';

const Card = ({ 
  children,
  className,
  title,
  action,
  ...props 
}) => {
  return (
    <div
      className={classNames(
        'bg-app-bg-secondary',
        'rounded-lg p-6',
        'border border-app-border',
        'shadow-card',
        'transition duration-200',
        'hover:shadow-card-hover',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-lg font-medium text-app-text-primary">
              {title}
            </h3>
          )}
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;