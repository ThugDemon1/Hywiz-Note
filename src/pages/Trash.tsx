import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, X, Search, Calendar } from 'lucide-react';
import { useNotesStore } from '../stores/useNotesStore';
import api from '../lib/api';

export const Trash: React.FC = () => {
  const { notes, fetchNotes, restoreNote, deleteNote, bulkPermanentDelete } = useNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  useEffect(() => {
    // Fetch deleted notes
    fetchNotes({ deleted: true });
  }, [fetchNotes]);

  const deletedNotes = notes.filter(note => note.isDeleted);
  const filteredNotes = deletedNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.plainTextContent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestore = async (noteId: string) => {
    try {
      await restoreNote(noteId);
    } catch (error) {
      console.error('Failed to restore note:', error);
    }
  };

  const handlePermanentDelete = async (noteId: string) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      try {
        // Use permanent delete endpoint if note is in trash
        await api.delete(`/notes/${noteId}/permanent`);
        fetchNotes({ deleted: true });
      } catch (error) {
        console.error('Failed to permanently delete note:', error);
      }
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selectedNotes.map(id => restoreNote(id)));
      setSelectedNotes([]);
    } catch (error) {
      console.error('Failed to restore notes:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete ${selectedNotes.length} notes? This action cannot be undone.`)) {
      try {
        await bulkPermanentDelete(selectedNotes);
        setSelectedNotes([]);
        fetchNotes({ deleted: true });
      } catch (error) {
        console.error('Failed to delete notes:', error);
      }
    }
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredNotes.map(note => note._id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-black-900">
      {/* Header */}
      <div className="bg-black-100 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-white">Trash</h1>
          {selectedNotes.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkRestore}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore ({selectedNotes.length})</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Delete Forever ({selectedNotes.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted notes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {filteredNotes.length > 0 && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedNotes.length === filteredNotes.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Select all</span>
            </label>
          )}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No deleted notes found' : 'Trash is empty'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Deleted notes will appear here and can be restored within 30 days'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotes.includes(note._id)}
                    onChange={() => handleSelectNote(note._id)}
                    className="mt-1 rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-2">{note.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {note.plainTextContent}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{note.primaryNotebookId?.name || 'My Notes'}</span>
                      {note.deletedAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Deleted {new Date(note.deletedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {note.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {note.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag._id}
                              className="px-2 py-0.5 bg-gray-100 rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-gray-400">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestore(note._id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                      title="Restore note"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(note._id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      title="Delete forever"
                    >
                      <X className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredNotes.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            Notes in trash are automatically deleted after 30 days. 
            Restore important notes before they're permanently removed.
          </p>
        </div>
      )}
    </div>
  );
};

export default Trash;