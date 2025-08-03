import React from 'react';

const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`input ${className}`} {...props} />
));

Input.displayName = 'Input';

export default Input; 