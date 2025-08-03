import React from 'react';
import classNames from 'classnames';

const Input = React.forwardRef(({ 
  label,
  error,
  className,
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && (
        <label className="block text-sm font-medium text-app-text-primary mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={classNames(
          'w-full px-4 py-2.5',
          'bg-app-bg-secondary',
          'border border-app-border',
          'rounded-lg',
          'text-app-text-primary',
          'placeholder-app-text-placeholder',
          'transition-all duration-200',
          'focus:outline-none focus:border-app-blue focus:ring-1 focus:ring-app-blue',
          error && 'border-app-status-error-border',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-app-status-error-text">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;