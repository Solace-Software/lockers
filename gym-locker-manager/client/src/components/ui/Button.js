import React from 'react';
import classNames from 'classnames';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  icon,
  disabled,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-2.5 text-sm rounded-lg',
    lg: 'px-8 py-3 text-base rounded-lg'
  };

  const variantClasses = {
    primary: 'bg-app-blue text-app-text-primary hover:bg-app-blue-dark focus:ring-app-blue',
    secondary: 'bg-app-bg-tertiary text-app-text-primary border border-app-border hover:bg-app-interactive-hover focus:ring-app-blue',
    outline: 'bg-transparent text-app-text-primary border border-app-border hover:bg-app-interactive-hover focus:ring-app-blue',
    danger: 'bg-app-status-error-bg text-app-status-error-text border border-app-status-error-border hover:bg-app-status-error-bg/80 focus:ring-app-status-error-border',
  };

  return (
    <button
      className={classNames(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;