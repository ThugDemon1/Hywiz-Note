import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Bell, Settings, User, LogOut, 
  Sun, Moon, Palette, Keyboard, HelpCircle,
  Menu, X
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { 
    toggleSearchModal, 
    toggleTemplatesModal,
    toggleDarkMode, 
    darkMode,
    sidebarOpen,
    toggleSidebar,
    toggleKeyboardShortcutsModal,
    openCustomizeModal,
    openImportExportModal
  } = useUIStore();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setShowNotificationsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-[#181818] dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search Button */}
          <button
            onClick={toggleSearchModal}
            className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Search notes...</span>
            <kbd className="hidden lg:inline px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded">⌘K</kbd>
          </button>
        </div>

        {/* Center Section */}
        <div className="flex items-center space-x-2">
          {/* Templates Button */}
          <button
            onClick={toggleTemplatesModal}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Note Templates"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={toggleKeyboardShortcutsModal}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Help */}
          <button
            onClick={() => window.open('https://help.evernote.com', '_blank')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative" ref={notificationsMenuRef}>
            <button 
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>

            {showNotificationsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-[#181818] dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                    <p className="text-sm text-gray-900 dark:text-white">New note shared with you</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                  </div>

                  <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white">Backup completed successfully</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Menu */}
          <div className="relative" ref={settingsMenuRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button 
                  onClick={() => {
                    openCustomizeModal();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Preferences
                </button>
                <button 
                  onClick={() => {
                    openImportExportModal('import');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Import Notes
                </button>
                <button 
                  onClick={() => {
                    openImportExportModal('export');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export Notes
                </button>
                <button 
                  onClick={() => {
                    // TODO: Implement sync settings
                    console.log('Sync settings clicked');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sync Settings
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button 
                  onClick={() => {
                    // TODO: Implement about modal
                    console.log('About clicked');
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  About
                </button>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button 
                  onClick={() => {
                    // TODO: Navigate to profile page
                    console.log('Profile clicked');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => {
                    // TODO: Navigate to account settings
                    console.log('Account settings clicked');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showSettingsMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowSettingsMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header; 