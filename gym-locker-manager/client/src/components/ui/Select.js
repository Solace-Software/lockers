import React from 'react';
import classNames from 'classnames';

const Select = React.forwardRef(({ 
  label,
  error,
  className,
  children,
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && (
        <label className="block text-sm font-medium text-app-text-primary mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={classNames(
          'w-full px-4 py-2.5',
          'bg-app-bg-secondary',
          'border border-app-border',
          'rounded-lg',
          'text-app-text-primary',
          'transition-all duration-200',
          'focus:outline-none focus:border-app-blue focus:ring-1 focus:ring-app-blue',
          error && 'border-app-status-error-border',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-app-status-error-text">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;