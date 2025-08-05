import React, { useState } from 'react';
import { 
  Filter, SortAsc, SortDesc, 
  Grid, List, MoreVertical, Share2, Palette,
  Trash2, Archive, Pin, Tag, BookOpen
} from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';

export const NotesToolbar: React.FC<{ onNoteCreated?: (noteId: string) => void; showFilters?: boolean; onToggleFilters?: () => void; }> = ({ onNoteCreated, showFilters, onToggleFilters }) => {
  const { 
    createNote, 
    viewMode, 
    setViewMode, 
    sortBy, 
    setSortBy, 
    sortOrder, 
    setSortOrder,
    selectedNotes,
    bulkOperation
  } = useNotesStore();
  
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: '',
        plainTextContent: ''
      });
      if (onNoteCreated && newNote._id) {
        onNoteCreated(newNote._id);
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'archive' | 'pin') => {
    if (selectedNotes.length === 0) return;

    try {
      await bulkOperation(action, selectedNotes);
    } catch (error) {
      console.error(`Failed to ${action} notes:`, error);
    }
  };

  const sortOptions = [
    { value: 'updatedAt', label: 'Last Modified' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'primaryNotebookId', label: 'Notebook' },
  ];

  const viewOptions = [
    { value: 'list', label: 'List View', icon: List },
    { value: 'grid', label: 'Grid View', icon: Grid },
  ];

  return (
    <div className="bg-[#23272B] px-0 py-0">
      <div className="flex items-center justify-end gap-2">
        {/* Center Section - Bulk Actions */}
        {selectedNotes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A3A7AB]">
              {selectedNotes.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('pin')}
              className="p-2 text-[#A3A7AB] hover:text-yellow-400 hover:bg-[#353A40] rounded-[8px] transition-colors h-[36px] w-[36px] flex items-center justify-center"
              title="Pin Notes"
            >
              <Pin className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="p-2 text-[#A3A7AB] hover:text-blue-400 hover:bg-[#353A40] rounded-[8px] transition-colors h-[36px] w-[36px] flex items-center justify-center"
              title="Archive Notes"
            >
              <Archive className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="p-2 text-[#A3A7AB] hover:text-red-400 hover:bg-[#353A40] rounded-[8px] transition-colors h-[36px] w-[36px] flex items-center justify-center"
              title="Delete Notes"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}
        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={onToggleFilters}
            className="h-[36px] w-[36px] flex items-center justify-center text-[#A3A7AB] bg-transparent rounded-[8px] hover:bg-[#353A40] transition-colors"
            title="Filter"
          >
            <Filter className="w-[22px] h-[22px]" />
          </button>
          {/* View Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="h-[36px] w-[36px] flex items-center justify-center text-[#A3A7AB] bg-transparent rounded-[8px] hover:bg-[#353A40] transition-colors"
              title="View"
            >
              {viewMode === 'list' ? <List className="w-[22px] h-[22px]" /> : <Grid className="w-[22px] h-[22px]" />}
            </button>

            {showViewMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {viewOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setViewMode(option.value as 'list' | 'grid');
                        setShowViewMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${
                        viewMode === option.value
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="h-[36px] w-[36px] flex items-center justify-center text-[#A3A7AB] bg-transparent rounded-[8px] hover:bg-[#353A40] transition-colors"
              title="Sort"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-[22px] h-[22px]" /> : <SortDesc className="w-[22px] h-[22px]" />}
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as any);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm ${
                      sortBy === option.value
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    setShowSortMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showSortMenu || showViewMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSortMenu(false);
            setShowViewMenu(false);
          }}
        />
      )}
    </div>
  );
};