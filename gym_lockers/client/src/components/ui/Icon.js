import React from 'react';
import classNames from 'classnames';

const Icon = ({ 
  icon: IconComponent,
  size = 'md',
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <IconComponent
      className={classNames(
        'text-app-text-primary',  // Always black in light theme
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export default Icon;