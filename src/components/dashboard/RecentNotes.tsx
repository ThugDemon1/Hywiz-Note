import React, { useEffect } from 'react';
import { FileText, Pin, Calendar } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const RecentNotes: React.FC = () => {
  const { notes, fetchNotes, createNote, setCurrentNote } = useNotesStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes({ limit: 6, sortBy: 'lastViewedAt' });
  }, [fetchNotes]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes?note=${noteId}`);
  };

  const handleCreateFirstNote = async () => {
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
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Recent Notes</h2>
        <button
          onClick={() => navigate('/notes')}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {notes.slice(0, 6).map((note) => (
          <div
            key={note._id}
            onClick={() => handleNoteClick(note._id)}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
                  {note.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}

                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {note.plainTextContent}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {note.primaryNotebookId?.name || 'My Notes'}
                  </span>
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <FileText className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notes yet</p>
          <button
            onClick={handleCreateFirstNote}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Create your first note
          </button>
        </div>
      )}
    </div>
  );
};