import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Filter, Calendar, Book, FileText, Clock, Star, Save } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useNotebooksStore } from '../../stores/useNotebooksStore';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchFilters {
  query: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
  primaryNotebookId: string | null;
  tags: string[];
  hasAttachments: boolean;

  isPinned: boolean;
  sortBy: 'relevance' | 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateRange: 'all',
    primaryNotebookId: null,
    tags: [],
    hasAttachments: false,

    isPinned: false,
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; filters: SearchFilters }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { searchNotes, searchResults, loading } = useNotesStore();
  const { notebooks } = useNotebooksStore();
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }

    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!filters.query.trim()) return;

    setIsSearching(true);
    try {
      await searchNotes(filters.query);
      
      // Save to recent searches
      const updatedRecent = [filters.query, ...recentSearches.filter(s => s !== filters.query)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (searchName) {
      const newSavedSearch = {
        id: Date.now().toString(),
        name: searchName,
        filters: { ...filters }
      };
      const updatedSaved = [...savedSearches, newSavedSearch];
      setSavedSearches(updatedSaved);
      localStorage.setItem('savedSearches', JSON.stringify(updatedSaved));
    }
  };

  const handleLoadSavedSearch = (savedSearch: typeof savedSearches[0]) => {
    setFilters(savedSearch.filters);
    handleSearch();
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes?note=${noteId}`);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      dateRange: 'all',
      primaryNotebookId: null,
      tags: [],
      hasAttachments: false,

      isPinned: false,
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search notes, titles, and content..."
              className="flex-1 text-lg border-none outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={handleSaveSearch}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {/* Notebook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Book className="w-4 h-4 inline mr-1" />
                  Notebook
                </label>
                <select
                  value={filters.primaryNotebookId || ''}
                  onChange={(e) => setFilters({ ...filters, primaryNotebookId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All notebooks</option>
                  {notebooks.map(notebook => (
                    <option key={notebook._id} value={notebook._id}>
                      {notebook.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="updatedAt">Last modified</option>
                  <option value="createdAt">Created date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mt-4 flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) => setFilters({ ...filters, hasAttachments: e.target.checked })}
                  className="rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Has attachments</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isPinned}
                  onChange={(e) => setFilters({ ...filters, isPinned: e.target.checked })}
                  className="rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Pinned notes</span>
              </label>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!filters.query && (
            <div className="p-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setFilters({ ...filters, query: search });
                          handleSearch();
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Searches</h3>
                  <div className="space-y-2">
                    {savedSearches.map((savedSearch) => (
                      <button
                        key={savedSearch.id}
                        onClick={() => handleLoadSavedSearch(savedSearch)}
                        className="flex items-center justify-between w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <span className="font-medium">{savedSearch.name}</span>
                        <span className="text-sm text-gray-500">{savedSearch.filters.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {filters.query && (
            <div className="p-6">
              {isSearching || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </h3>
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Search
                    </button>
                  </div>
                  <div className="space-y-3">
                    {searchResults.map((note) => (
                      <div
                        key={note._id}
                        onClick={() => handleNoteClick(note._id)}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{note.title}</h4>
                          <div className="flex items-center space-x-2">
                            {note.isPinned && <Star className="w-4 h-4 text-yellow-500" />}
                            <span className="text-sm text-gray-500">
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {note.plainTextContent}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{note.primaryNotebookId?.name}</span>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {note.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag._id}
                                  className="px-2 py-0.5 bg-gray-100 rounded-full"
                                  style={{ color: tag.color }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;