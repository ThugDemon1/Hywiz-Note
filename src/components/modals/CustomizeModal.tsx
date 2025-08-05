import React, { useState, useEffect } from 'react';
import { X, Upload, Palette, Monitor, Sun, Moon, Clock } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';

const backgroundImages = [
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200'
];

const greetings = [
  'Good morning',
  'Hello',
  'Welcome back',
  'Hi there',
  'Greetings',
  'Hey'
];

export const CustomizeModal: React.FC = () => {
  const { user, updatePreferences } = useAuthStore();
  const { closeCustomizeModal, setTheme, customizeModalOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState('appearance');
  const [selectedBackground, setSelectedBackground] = useState(user?.preferences?.backgroundImage || backgroundImages[0]);
  const [selectedGreeting, setSelectedGreeting] = useState(user?.preferences?.greeting || 'Good morning');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(user?.preferences?.theme || 'light');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update local state when user preferences change
  useEffect(() => {
    if (user?.preferences) {
      setSelectedBackground(user.preferences.backgroundImage || backgroundImages[0]);
      setSelectedGreeting(user.preferences.greeting || 'Good morning');
      setSelectedTheme(user.preferences.theme || 'light');
    }
  }, [user?.preferences]);

  const handleSave = async () => {
    try {
      await updatePreferences({
        backgroundImage: selectedBackground,
        greeting: selectedGreeting,
        theme: selectedTheme as 'light' | 'dark' | 'auto'
      });
      setTheme(selectedTheme as 'light' | 'dark' | 'auto');
      closeCustomizeModal();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  if (!customizeModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#181818] rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#232323] rounded-l-lg p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Customize</h2>
            <button
              onClick={closeCustomizeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'dashboard', label: 'Dashboard', icon: Monitor },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'auto', label: 'Auto', icon: Monitor }
                  ].map((themeOption) => {
                    const IconComponent = themeOption.icon;
                    return (
                      <button
                        key={themeOption.id}
                        onClick={() => setSelectedTheme(themeOption.id)}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                          selectedTheme === themeOption.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                        <span className="text-sm font-medium">{themeOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Background Image</h3>
                <div className="grid grid-cols-3 gap-4">
                  {backgroundImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedBackground(image)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedBackground === image
                          ? 'border-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Background ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedBackground === image && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <button className="mt-4 flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  <span>Upload Custom Image</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Greeting Message</h3>
                <div className="grid grid-cols-2 gap-3">
                  {greetings.map((greeting) => (
                    <button
                      key={greeting}
                      onClick={() => setSelectedGreeting(greeting)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedGreeting === greeting
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {greeting}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Greeting
                  </label>
                  <input
                    type="text"
                    value={selectedGreeting}
                    onChange={(e) => setSelectedGreeting(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter custom greeting"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Current Time</h3>
                <div className="flex items-center space-x-2 text-2xl font-mono">
                  <Clock className="w-6 h-6 text-gray-500" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Layout Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show recent notes</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show shortcuts</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show scratch pad</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="ml-2">Show recently captured</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={closeCustomizeModal}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};