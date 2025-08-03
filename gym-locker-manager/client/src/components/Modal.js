import React from 'react';

const Modal = ({ open, onClose, children, className = '' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white/50 backdrop-blur-md border border-blueglass-700 shadow-glass rounded-2xl p-8 w-full max-w-md ${className}`}>
        {children}
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary mt-4 w-full"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal; 