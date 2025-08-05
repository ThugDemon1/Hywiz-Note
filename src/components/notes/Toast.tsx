import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded shadow-lg font-medium
        ${type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}
      style={{ minWidth: 220, textAlign: 'center' }}
    >
      {message}
    </div>
  );
}; 