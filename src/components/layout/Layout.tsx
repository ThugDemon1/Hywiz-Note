import React from 'react';
import { Sidebar } from './Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="h-screen flex bg-[#202124] overflow-hidden font-['Segoe UI','Helvetica Neue',Arial,sans-serif]">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full min-h-0">
        <main className="flex-1 h-full min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 