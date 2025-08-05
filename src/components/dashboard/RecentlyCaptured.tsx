import React, { useState } from 'react';
import { Globe, Image, FileText, Mic, Mail, Clock } from 'lucide-react';

const tabs = [
  { id: 'webclips', label: 'Web Clips', icon: Globe },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'email', label: 'Email', icon: Mail },
];

const mockItems = {
  webclips: [
    {
      id: '1',
      title: 'How to Build Better Habits',
      url: 'medium.com',
      timestamp: '2 hours ago',
      thumbnail: 'https://images.pexels.com/photos/1029604/pexels-photo-1029604.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      id: '2',
      title: 'React Best Practices 2024',
      url: 'dev.to',
      timestamp: '1 day ago',
      thumbnail: 'https://images.pexels.com/photos/416405/pexels-photo-416405.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ],
  images: [
    {
      id: '1',
      title: 'Meeting Whiteboard',
      timestamp: '30 minutes ago',
      thumbnail: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ],
  documents: [
    {
      id: '1',
      title: 'Project Proposal.pdf',
      timestamp: '1 hour ago',
      thumbnail: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ],
  audio: [],
  email: []
};

export const RecentlyCaptured: React.FC = () => {
  const [activeTab, setActiveTab] = useState('webclips');

  const currentItems = mockItems[activeTab as keyof typeof mockItems] || [];

  return (
    <div className="bg-[#181818] rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recently Captured</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>

      <div className="flex space-x-1 mb-4 bg-[#232323] rounded-lg p-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#181818] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {currentItems.length > 0 ? (
          currentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {item.title}
                </h4>
                {'url' in item && (
                  <p className="text-xs text-gray-500">{item.url}</p>
                )}
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || Globe, {
                className: "w-6 h-6 text-gray-400"
              })}
            </div>
            <p className="text-gray-500 text-sm">No {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} captured yet</p>
          </div>
        )}
      </div>
    </div>
  );
};