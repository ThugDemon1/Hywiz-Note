import React, { useState } from 'react';
import { Pin, Calendar, Paperclip, MoreVertical, Edit, Copy, Share2, Trash2, Users, Globe, FileText } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { Note } from '../../stores/useNotesStore';

interface NotesListProps {
  // notes: Note[]; // REMOVE this prop
  loading: boolean;
  viewMode: 'list' | 'grid' | 'snippets';
  onNoteSelect: (noteId: string) => void;
  selectedNoteId: string | null;
  onDeleteNote: (noteId: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  // notes, // REMOVE
  loading,
  viewMode,
  onNoteSelect,
  selectedNoteId,
  onDeleteNote
}) => {
  const notes = useNotesStore(state => state.notes); // <-- Get notes directly from store
  const { deleteNote, duplicateNote, pinNote } = useNotesStore();
  const [showMenuFor, setShowMenuFor] = React.useState<string | null>(null);

  const handleNoteMenuClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setShowMenuFor(showMenuFor === noteId ? null : noteId);
  };

  const handleMenuAction = async (action: string, noteId: string) => {
    try {
      switch (action) {
        case 'delete':
          await deleteNote(noteId);
          break;
        case 'duplicate':
          await duplicateNote(noteId);
          break;
        case 'pin':
          const note = notes.find(n => n._id === noteId);
          if (note) {
            await pinNote(noteId, !note.isPinned);
          }
          break;
        case 'share':
          // TODO: Implement sharing functionality
          console.log('Share note:', noteId);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} note:`, error);
    } finally {
      setShowMenuFor(null);
    }
  };

  const handleClickOutside = () => {
    setShowMenuFor(null);
  };

  // Remove the useEffect that fetches notes on window focus and mount

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-500">Create your first note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {notes.map(note => {
        const isSelected = selectedNoteId === note._id;
        return (
          <div
            key={note._id}
            className={`bg-[#23272B] border border-[#23272B] rounded-[8px] px-4 py-3 shadow-none transition-colors cursor-pointer ${isSelected ? 'bg-[#353A40]' : ''}`}
            style={{ height: 115, position: 'relative' }}
            onClick={() => onNoteSelect(note._id)}
          >
            {/* Delete Button */}
            <button
              onClick={e => { 
                e.stopPropagation(); 
                onDeleteNote(note._id);
              }}
              className="absolute top-2 right-2 h-[32px] w-[32px] flex items-center justify-center text-[#A3A7AB] bg-transparent rounded-[8px] hover:bg-[#353A40] hover:text-red-400 transition-colors z-10"
              title="Delete Note"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>

            {/* Sharing Indicators */}
            <div className="absolute top-2 right-12 flex items-center gap-1">
              {/* Note: These indicators would show when sharing is implemented */}
              {/* For now, we'll show them based on a simple condition */}
              {note.title && note.title.length > 20 && (
                <Globe className="w-4 h-4 text-green-500" />
              )}
              {note.attachments && note.attachments.length > 0 && (
                <Users className="w-4 h-4 text-blue-500" />
              )}
            </div>

            <div className="flex items-center gap-3 h-full">
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-semibold bg-[#818cf8]">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div>
                  <div className="text-[16px] font-bold text-white truncate">{note.title || 'Untitled Note'}</div>
                  <div className="text-[12px] text-[#A3A7AB] truncate" dangerouslySetInnerHTML={{ __html: note.content ? note.content.slice(0, 120) : 'No content' }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="flex-1 text-left truncate text-[13px] text-[#A3A7AB]">
                    {typeof note.primaryNotebookId === 'object' && note.primaryNotebookId !== null && 'name' in note.primaryNotebookId
                      ? note.primaryNotebookId.name
                      : typeof note.primaryNotebookId === 'string' && note.primaryNotebookId
                      ? note.primaryNotebookId
                      : 'My Notes'}
                  </span>
                  <span className="flex-shrink-0 text-right text-[13px] text-[#A3A7AB]">{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};