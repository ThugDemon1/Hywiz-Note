import { create } from 'zustand';
import api from '../lib/api';
import socket from '../lib/socket';

export interface Note {
  _id: string;
  title: string;
  userId: string;
  notebookIds: Array<{
    _id: string;
    name: string;
    color: string;
  }> | string[];
  primaryNotebookId: {
    _id: string;
    name: string;
    color: string;
  } | string;
  tags: Array<{
    _id: string;
    name: string;
    color: string;
  }> | string[];
  attachments: Array<{
    filename: string;
    originalName: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  lastViewedAt: string;
  createdAt: string;
  updatedAt: string;
  collaborators?: Array<{
    userId: string | {
      _id: string;
      name: string;
      email: string;
    };
    permission: 'read' | 'write' | 'admin';
    addedAt: string;
  }>;
  shareSettings?: {
    isPublic: boolean;
    allowEdit: boolean;
    allowComments: boolean;
    passwordProtected: boolean;
    password: string;
    expiresAt: string;
    publicUrl?: string;
  };

}

interface NotesState {
  notes: Note[];
  currentNote: Note | null;
  selectedNotes: string[];
  searchResults: Note[];
  searchQuery: string;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  viewMode: 'list' | 'grid' | 'snippets';
  loading: boolean;
  saving: boolean;
  autoSaveTimeout: NodeJS.Timeout | null;
  currentPage: number;
  totalPages: number;
  total: number;
  savedSearches: any[];
  sharedWithMe: any[];
  sharedByMe: any[];
  bulkPermanentDelete: (noteIds: string[]) => Promise<void>;

  // Actions
  fetchNotes: (filters?: any) => Promise<void>;
  fetchNote: (id: string) => Promise<Note>;
  createNote: (noteData: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<Note>;
  pinNote: (id: string, isPinned: boolean) => Promise<void>;
  importNotes: (file: File, format: 'json' | 'txt' | 'md') => Promise<void>;
  exportNotes: (noteIds: string[], format: 'json' | 'txt' | 'md') => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  selectNote: (id: string) => void;
  selectMultipleNotes: (ids: string[]) => void;
  clearSelection: () => void;
  searchNotes: (query: string) => Promise<void>;
  autoSaveNote: (id: string, title: string) => void;
  bulkOperation: (action: string, noteIds: string[], data?: any) => Promise<void>;
  setSortBy: (sortBy: 'updatedAt' | 'createdAt' | 'title') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setViewMode: (mode: 'list' | 'grid' | 'snippets') => void;
  fetchSavedSearches: () => Promise<void>;
  createSavedSearch: (data: { name: string; query: string; filters: any }) => Promise<void>;
  updateSavedSearch: (id: string, data: { name: string; query: string; filters: any }) => Promise<void>;
  deleteSavedSearch: (id: string) => Promise<void>;
  shareNote: (noteId: string, collaboratorId: string, permission: string) => Promise<void>;
  updateCollaborator: (noteId: string, collaboratorId: string, permission: string) => Promise<void>;
  removeCollaborator: (noteId: string, collaboratorId: string) => Promise<void>;
  fetchSharedWithMe: () => Promise<void>;
  fetchSharedByMe: () => Promise<void>;
  uploadAttachment: (noteId: string, file: File) => Promise<any>;
  removeAttachment: (noteId: string, filename: string) => Promise<void>;
  fetchBacklinks: (noteId: string) => Promise<{ _id: string; title: string }[]>;
  saveSharedNote: (id: string) => Promise<Note>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  selectedNotes: [],
  searchResults: [],
  searchQuery: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  viewMode: 'list',
  loading: false,
  saving: false,
  autoSaveTimeout: null,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  savedSearches: [],
  sharedWithMe: [],
  sharedByMe: [],
  bulkPermanentDelete: async (noteIds: string[]) => {
    try {
      await api.post('/notes/bulk-permanent', { noteIds });
      get().fetchNotes();
    } catch (error) {
      console.error('Bulk permanent delete error:', error);
      throw error;
    }
  },

  fetchNotes: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = {
        page: get().currentPage,
        sortBy: get().sortBy,
        sortOrder: get().sortOrder,
        ...filters
      };
      
      const response = await api.get('/notes', { params });
      set({ 
        notes: response.data.notes,
        totalPages: response.data.totalPages,
        total: response.data.total,
        loading: false 
      });
    } catch (error) {
      console.error('Fetch notes error:', error);
      set({ loading: false });
    }
  },

  fetchNote: async (id: string) => {
    try {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Fetch note error:', error);
      throw error;
    }
  },

  createNote: async (noteData: Partial<Note>) => {
    try {
      console.log('Creating note with data:', noteData);
      const response = await api.post('/notes', noteData);
      const newNote = response.data;
      console.log('Note created successfully:', newNote);
      
      set(state => ({
        notes: [newNote, ...state.notes],
        total: state.total + 1
      }));
      
      return newNote;
    } catch (error: any) {
      console.error('Create note error:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  updateNote: async (id: string, data: Partial<Note>) => {
    set({ saving: true });
    try {
      const response = await api.put(`/notes/${id}`, data);
      const updatedNote = response.data;
      
      set(state => ({
        notes: state.notes.map(note => 
          note._id === id ? updatedNote : note
        ),
        currentNote: state.currentNote?._id === id ? updatedNote : state.currentNote,
        saving: false
      }));
      
      return updatedNote;
    } catch (error) {
      console.error('Update note error:', error);
      set({ saving: false });
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    try {
      await api.delete(`/notes/${id}`);
      set(state => ({
        notes: state.notes.filter(note => note._id !== id),
        selectedNotes: state.selectedNotes.filter(noteId => noteId !== id),
        currentNote: state.currentNote?._id === id ? null : state.currentNote,
        total: state.total - 1
      }));
    } catch (error) {
      console.error('Delete note error:', error);
      throw error;
    }
  },

  restoreNote: async (id: string) => {
    try {
      await api.post(`/notes/${id}/restore`);
      // Refresh notes list
      get().fetchNotes();
    } catch (error) {
      console.error('Restore note error:', error);
      throw error;
    }
  },

  duplicateNote: async (id: string) => {
    try {
      const response = await api.post(`/notes/${id}/duplicate`);
      const duplicatedNote = response.data;
      
      set(state => ({
        notes: [duplicatedNote, ...state.notes],
        total: state.total + 1
      }));
      
      return duplicatedNote;
    } catch (error) {
      console.error('Duplicate note error:', error);
      throw error;
    }
  },

  saveSharedNote: async (id: string) => {
    try {
      const response = await api.post(`/notes/${id}/save-shared`);
      const savedNote = response.data;
      
      set(state => ({
        notes: [savedNote, ...state.notes],
        total: state.total + 1
      }));
      
      return savedNote;
    } catch (error) {
      console.error('Save shared note error:', error);
      throw error;
    }
  },

  pinNote: async (id: string, isPinned: boolean) => {
    try {
      await get().updateNote(id, { isPinned });
    } catch (error) {
      console.error('Pin note error:', error);
      throw error;
    }
  },

  importNotes: async (file: File, format: 'json' | 'txt' | 'md') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      
      const response = await api.post('/notes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh notes list after import
      get().fetchNotes();
    } catch (error) {
      console.error('Import notes error:', error);
      throw error;
    }
  },

  exportNotes: async (noteIds: string[], format: 'json' | 'txt' | 'md') => {
    try {
      const response = await api.post('/notes/export', {
        noteIds,
        format
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notes-export-${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export notes error:', error);
      throw error;
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note });
  },

  selectNote: (id: string) => {
    set(state => ({
      selectedNotes: state.selectedNotes.includes(id)
        ? state.selectedNotes.filter(noteId => noteId !== id)
        : [...state.selectedNotes, id]
    }));
  },

  selectMultipleNotes: (ids: string[]) => {
    set({ selectedNotes: ids });
  },

  clearSelection: () => {
    set({ selectedNotes: [] });
  },

  searchNotes: async (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      const response = await api.get('/search', { 
        params: { q: query, type: 'notes' } 
      });
      set({ searchResults: response.data.notes || [] });
    } catch (error) {
      console.error('Search notes error:', error);
      set({ searchResults: [] });
    }
  },

  autoSaveNote: async (id: string, title: string) => {
    const { autoSaveTimeout } = get();
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      try {
        set({ saving: true });
        await get().updateNote(id, { title });
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        set({ saving: false });
      }
    }, 3000);

    set({ autoSaveTimeout: timeout });
  },

  bulkOperation: async (action: string, noteIds: string[], data?: any) => {
    try {
      if (action === 'permanent') {
        await get().bulkPermanentDelete(noteIds);
      } else {
        await api.post('/notes/bulk', { action, noteIds, data });
        get().fetchNotes();
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      throw error;
    }
  },

  setSortBy: (sortBy: 'updatedAt' | 'createdAt' | 'title') => {
    set({ sortBy });
    get().fetchNotes();
  },

  setSortOrder: (sortOrder: 'asc' | 'desc') => {
    set({ sortOrder });
    get().fetchNotes();
  },

  setViewMode: (viewMode: 'list' | 'grid' | 'snippets') => {
    set({ viewMode });
  },

  fetchSavedSearches: async () => {
    try {
      const res = await api.get('/search/saved-searches');
      set({ savedSearches: res.data });
    } catch (err) {
      console.error('Fetch saved searches error:', err);
    }
  },

  createSavedSearch: async (data) => {
    try {
      await api.post('/search/saved-searches', data);
      await get().fetchSavedSearches();
    } catch (err) {
      console.error('Create saved search error:', err);
    }
  },

  updateSavedSearch: async (id, data) => {
    try {
      await api.put(`/search/saved-searches/${id}`, data);
      await get().fetchSavedSearches();
    } catch (err) {
      console.error('Update saved search error:', err);
    }
  },

  deleteSavedSearch: async (id) => {
    try {
      await api.delete(`/search/saved-searches/${id}`);
      await get().fetchSavedSearches();
    } catch (err) {
      console.error('Delete saved search error:', err);
    }
  },



  shareNote: async (noteId: string, collaboratorId: string, permission: string) => {
    try {
      await api.post(`/notes/${noteId}/share`, { collaboratorId, permission });
      await get().fetchSharedByMe();
    } catch (err) {
      console.error('Share note error:', err);
    }
  },

  updateCollaborator: async (noteId: string, collaboratorId: string, permission: string) => {
    try {
      await api.patch(`/notes/${noteId}/share`, { collaboratorId, permission });
      await get().fetchSharedByMe();
    } catch (err) {
      console.error('Update collaborator error:', err);
    }
  },

  removeCollaborator: async (noteId: string, collaboratorId: string) => {
    try {
      await api.delete(`/notes/${noteId}/share/${collaboratorId}`);
      await get().fetchSharedByMe();
    } catch (err) {
      console.error('Remove collaborator error:', err);
    }
  },

  fetchSharedWithMe: async () => {
    try {
      const res = await api.get('/notes/shared/with-me');
      set({ sharedWithMe: res.data });
    } catch (err) {
      console.error('Fetch shared with me error:', err);
    }
  },

  fetchSharedByMe: async () => {
    try {
      const res = await api.get('/notes/shared/by-me');
      set({ sharedByMe: res.data });
    } catch (err) {
      console.error('Fetch shared by me error:', err);
    }
  },

  uploadAttachment: async (noteId: string, file: File) => {
    // 1. Upload file
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const attachment = uploadRes.data;
    // 2. Add attachment to note
    const res = await api.post(`/notes/${noteId}/attachments`, { attachment });
    // 3. Update local note state
    set(state => ({
      notes: state.notes.map(n => n._id === noteId ? { ...n, attachments: res.data } : n),
      currentNote: state.currentNote?._id === noteId ? { ...state.currentNote, attachments: res.data } : state.currentNote
    }));
    return attachment;
  },

  removeAttachment: async (noteId: string, filename: string) => {
    await api.delete(`/notes/${noteId}/attachments/${filename}`);
    // Refetch note to update attachments
    const updated = await get().fetchNote(noteId);
    set(state => ({
      notes: state.notes.map(n => n._id === noteId ? updated : n),
      currentNote: state.currentNote?._id === noteId ? updated : state.currentNote
    }));
  },

  fetchBacklinks: async (noteId: string) => {
    const res = await api.get(`/notes/${noteId}/backlinks`);
    return res.data;
  },
}));

// --- SOCKET.IO REALTIME LISTENERS ---
if (typeof window !== 'undefined' && !(window as any)._notesListenersAdded) {
  (window as any)._notesListenersAdded = true;

  socket.on('note-shared', (updatedNote) => {
    useNotesStore.setState(state => ({
      notes: state.notes.map(note =>
        note._id === updatedNote._id ? { ...note, ...updatedNote } : note
      ),
      currentNote: state.currentNote?._id === updatedNote._id
        ? { ...state.currentNote, ...updatedNote }
        : state.currentNote,
    }));
  });

  socket.on('collaborator-updated', (updatedNote) => {
    useNotesStore.setState(state => ({
      notes: state.notes.map(note =>
        note._id === updatedNote._id ? { ...note, ...updatedNote } : note
      ),
      currentNote: state.currentNote?._id === updatedNote._id
        ? { ...state.currentNote, ...updatedNote }
        : state.currentNote,
    }));
  });
}