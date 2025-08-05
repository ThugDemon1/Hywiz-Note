import React from 'react';
import { Plus, FileText, Book, Tag, Search, Users, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../../stores/useNotesStore';
import { useAuthStore } from '../../stores/useAuthStore';

const shortcuts = [
  { id: 'new-note', name: 'New Note', icon: Plus, path: '/notes', action: 'create' },
  { id: 'all-notes', name: 'All Notes', icon: FileText, path: '/notes' },
  { id: 'notebooks', name: 'Notebooks', icon: Book, path: '/notebooks' },
  { id: 'tags', name: 'Tags', icon: Tag, path: '/tags' },
  { id: 'search', name: 'Search', icon: Search, action: 'search' },
  { id: 'shared', name: 'Shared', icon: Users, path: '/shared' },

];

export const QuickShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const { createNote, setCurrentNote } = useNotesStore();
  const { user } = useAuthStore();

  const handleShortcutClick = async (shortcut: typeof shortcuts[0]) => {
    if (shortcut.action === 'create') {
      try {
        // Check if user is authenticated
        if (!user) {
          console.error('User not authenticated');
          navigate('/login');
          return;
        }
        
        const newNote = await createNote({
          title: 'Untitled',
          content: '',
          plainTextContent: ''
        });
        
        // Set the current note in the store
        setCurrentNote(newNote);
        
        // Navigate to the note editor
        navigate(`/notes?note=${newNote._id}`);
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    } else if (shortcut.action === 'search') {
      // Handle search modal opening
      // This would be handled by the search modal
    } else if (shortcut.path) {
      navigate(shortcut.path);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Quick Shortcuts</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Customize
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((shortcut) => {
          const IconComponent = shortcut.icon;
          return (
            <button
              key={shortcut.id}
              onClick={() => handleShortcutClick(shortcut)}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 truncate">
                {shortcut.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};