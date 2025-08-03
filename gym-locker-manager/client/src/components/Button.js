import React from 'react';

const Button = ({ className = '', variant = 'primary', children, ...props }) => {
  const variantClass = variant ? `btn-${variant}` : '';
  return (
    <button className={`btn ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button; 