import React, { useState } from 'react';
import { Plus, Search, Zap, FileText, Book, Tag, Users, Bell, Trash2, Edit, MoreVertical } from 'lucide-react';

interface Shortcut {
  id: string;
  name: string;
  icon: string;
  type: 'note' | 'notebook' | 'tag' | 'search' | 'url';
  target?: string;
  url?: string;
  position: number;
}

const iconMap = {
  'file-text': FileText,
  'book': Book,
  'tag': Tag,
  'users': Users,
  'bell': Bell,
  'search': Search,
  'zap': Zap
};

const mockShortcuts: Shortcut[] = [
  { id: '1', name: 'Meeting Notes', icon: 'file-text', type: 'search', target: 'meeting', position: 1 },
  { id: '2', name: 'Work Notebook', icon: 'book', type: 'notebook', target: 'work-notebook-id', position: 2 },
  { id: '3', name: 'Important', icon: 'tag', type: 'tag', target: 'important', position: 3 },
  { id: '4', name: 'Shared Projects', icon: 'users', type: 'search', target: 'shared:true', position: 4 },

  { id: '6', name: 'Quick Ideas', icon: 'zap', type: 'notebook', target: 'ideas-notebook-id', position: 6 },
];

export const Shortcuts: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(mockShortcuts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateShortcut = (shortcutData: Omit<Shortcut, 'id' | 'position'>) => {
    const newShortcut: Shortcut = {
      ...shortcutData,
      id: Date.now().toString(),
      position: shortcuts.length + 1
    };
    setShortcuts([...shortcuts, newShortcut]);
    setShowCreateModal(false);
  };

  const handleDeleteShortcut = (id: string) => {
    setShortcuts(shortcuts.filter(s => s.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Shortcuts</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Shortcut</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shortcuts..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredShortcuts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No shortcuts found' : 'No shortcuts yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Create shortcuts for quick access to your most important content'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Shortcut
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredShortcuts.map((shortcut) => {
                  const IconComponent = iconMap[shortcut.icon as keyof typeof iconMap] || FileText;
                  return (
                    <div
                      key={shortcut.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteShortcut(shortcut.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2">{shortcut.name}</h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="capitalize">{shortcut.type}</span>
                        {shortcut.target && (
                          <span className="truncate ml-2">{shortcut.target}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Shortcut Modal */}
      {showCreateModal && (
        <CreateShortcutModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateShortcut}
        />
      )}
    </div>
  );
};

// Create Shortcut Modal Component
const CreateShortcutModal: React.FC<{
  onClose: () => void;
  onCreate: (data: Omit<Shortcut, 'id' | 'position'>) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'note' | 'notebook' | 'tag' | 'search' | 'url'>('search');
  const [target, setTarget] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('file-text');

  const icons = [
    { id: 'file-text', component: FileText },
    { id: 'book', component: Book },
    { id: 'tag', component: Tag },
    { id: 'users', component: Users },
    { id: 'bell', component: Bell },
    { id: 'search', component: Search },
    { id: 'zap', component: Zap },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate({
        name: name.trim(),
        icon: selectedIcon,
        type,
        target: target.trim() || undefined,
        url: type === 'url' ? target.trim() : undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Shortcut</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shortcut Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter shortcut name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="search">Search Query</option>
              <option value="notebook">Notebook</option>
              <option value="tag">Tag</option>
              <option value="note">Specific Note</option>
              <option value="url">External URL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'search' && 'Search Query'}
              {type === 'notebook' && 'Notebook Name'}
              {type === 'tag' && 'Tag Name'}
              {type === 'note' && 'Note Title'}
              {type === 'url' && 'URL'}
            </label>
            <input
              type={type === 'url' ? 'url' : 'text'}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={
                type === 'search' ? 'Enter search terms...' :
                type === 'notebook' ? 'Enter notebook name...' :
                type === 'tag' ? 'Enter tag name...' :
                type === 'note' ? 'Enter note title...' :
                'Enter URL...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {icons.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`p-3 border rounded-md flex items-center justify-center transition-colors ${
                      selectedIcon === icon.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Shortcut
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Shortcuts;