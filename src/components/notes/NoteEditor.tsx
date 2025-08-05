import React, { useState, useEffect, useRef } from 'react';
import { X, Share, Pin, Book, Maximize2, FileText, Link, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { Note } from '../../stores/useNotesStore';
// import NoteHistoryModal from './NoteHistoryModal'; // Uncomment if file exists
import { useTagsStore } from '../../stores/useTagsStore';
import { useNotebooksStore } from '../../stores/useNotebooksStore';
import { useUIStore } from '../../stores/useUIStore';
import './note-editor-print.css';
import { EditorToolbar } from '../editor/EditorToolbar';
import { NoteMoreMenu } from './NoteMoreMenu';
import { useParams } from 'react-router-dom';
import { ShareButton } from './ShareButton';
import { copyToClipboard, generateShareLink, showToast } from '../../lib/utils';
import { useTemplatesStore } from '../../stores/useTemplatesStore';
import { Template } from '../../stores/useTemplatesStore';
import socket from '../../lib/socket';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import debounce from 'lodash.debounce';
import { MinimalTitleEditor } from './MinimalTitleEditor';

interface NoteEditorProps {
  noteId: string;
  onClose: () => void;
  type?: 'note' | 'template';
  readOnly?: boolean;
  notesListCollapsed?: boolean;
  setNotesListCollapsed?: (collapsed: boolean) => void;
  shared?: boolean;
}

let noteEditorDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId: propNoteId, onClose, type = 'note', readOnly = false, notesListCollapsed, setNotesListCollapsed, shared }) => {
  const notesStore = useNotesStore();
  const templatesStore = useTemplatesStore();
  const { tags, fetchTags, createTag } = useTagsStore();
  const { notebooks, fetchNotebooks } = useNotebooksStore();
  const { openImportExportModal } = useUIStore();
  const [item, setItem] = useState<Note | Template | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');

  const [collabEmail, setColabEmail] = useState('');
  const [collabPermission, setColabPermission] = useState('read');
  const [sharingError, setSharingError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const [backlinks, setBacklinks] = useState<{ _id: string; title: string }[]>([]);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveSearch, setMoveSearch] = useState("");
  const [selectedMoveNotebook, setSelectedMoveNotebook] = useState(type === 'note' && item && 'primaryNotebookId' in item && typeof item.primaryNotebookId === 'object' && item.primaryNotebookId && '_id' in item.primaryNotebookId ? item.primaryNotebookId._id : '');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [editorFocused, setEditorFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const params = useParams();
  const noteId = propNoteId || params.noteId;
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const initialTitleSetRef = useRef(false);
  const [yjsReady, setYjsReady] = useState(false);
  // Add a ref to track if we're initializing the Yjs title from the DB
  const initializingTitleRef = useRef(true);
  // Add a ref to track the last initialized noteId
  const lastInitializedNoteIdRef = useRef<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  // Use local state only if not controlled by props
  const isCollapsed = typeof notesListCollapsed === 'boolean' ? notesListCollapsed : previewCollapsed;
  const handleCollapseToggle = () => {
    if (typeof setNotesListCollapsed === 'function') {
      setNotesListCollapsed(!isCollapsed);
    } else {
      setPreviewCollapsed(v => !v);
    }
  };

  // Use correct store based on type
  const fetchItem = type === 'note' ? notesStore.fetchNote : templatesStore.fetchTemplate;
  const autoSaveItem = type === 'note' ? notesStore.autoSaveNote : templatesStore.updateTemplate;
  const pinItem = type === 'note' ? notesStore.pinNote : templatesStore.pinTemplate;
  const updateItem = type === 'note' ? notesStore.updateNote : templatesStore.updateTemplate;

  const shareItem = type === 'note' ? notesStore.shareNote : templatesStore.shareTemplate;
  const addCollaborator = type === 'note' ? notesStore.shareNote : templatesStore.addCollaborator;
  const updateCollaborator = type === 'note' ? notesStore.updateCollaborator : templatesStore.updateCollaboratorPermission;
  const removeCollaborator = type === 'note' ? notesStore.removeCollaborator : templatesStore.removeCollaborator;
  const uploadAttachment = type === 'note' ? notesStore.uploadAttachment : undefined;
  const removeAttachment = type === 'note' ? notesStore.removeAttachment : undefined;
  const fetchBacklinks = type === 'note' ? notesStore.fetchBacklinks : async () => [];
  const duplicateItem = type === 'note' ? notesStore.duplicateNote : templatesStore.duplicateTemplate;

  const noteFromStore = type === 'note' ? useNotesStore(state => state.notes.find(n => n._id === noteId)) : null;

  // Load item data
  useEffect(() => {
    if (!noteId) {
      return;
    }
    const loadItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchItem(noteId || '');
        setItem(data);
        setTitleValue(data.title || '');

      } catch (error) {
        setError('Failed to load item. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadItem();
  }, [noteId, fetchItem]);

  // Sync local state with store note ONLY on initial load or noteId change
  useEffect(() => {
    if (type === 'note') {
      if (!noteFromStore) {
        // Note was deleted or not found
        setItem(null);
        setTitleValue('');
        setContent('');
        setError('Note not found or was deleted.');
        setTimeout(() => onClose(), 1500); // Auto-close after 1.5s
        return;
      }
      // Only update if noteId changes or item is null
      if (!item || noteFromStore._id !== item._id) {
        setItem(noteFromStore);
        setTitleValue(noteFromStore.title || '');

        setError(null);
      }
    }
  }, [noteFromStore, type, onClose]);

  // 1. Immediate local state update for title/content on note switch
  useEffect(() => {
    if (!item) return;
    setTitleValue(item.title || 'Untitled');
    
  }, [item]);

  useEffect(() => {
    fetchTags();
    fetchNotebooks();
  }, [fetchTags, fetchNotebooks]);

  useEffect(() => {
    setSelectedTags(
      type === 'note' && item
        ? item.tags.map(t => typeof t === 'string' ? t : (t && typeof t === 'object' && '._id' in t ? t._id : ''))
        : []
    );
    setSelectedNotebook(
      type === 'note' && item && 'primaryNotebookId' in item && typeof item.primaryNotebookId === 'string'
        ? item.primaryNotebookId
        : (type === 'note' && item && 'primaryNotebookId' in item && item.primaryNotebookId && typeof item.primaryNotebookId === 'object' && '_id' in item.primaryNotebookId ? item.primaryNotebookId._id : '')
    );
  }, [item]);



  // Load backlinks
  useEffect(() => {
    if (noteId) {
      fetchBacklinks(noteId).then(setBacklinks).catch(() => setBacklinks([]));
    }
  }, [noteId, fetchBacklinks]);

  // Collaborative title logic (remove socket.io for title updates)
  // If you want to sync title in real-time, use Yjs awareness or a shared Yjs field instead

  // Add Save button logic
  // const handleSave = () => {
  //   const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
  //   autoSaveItem(noteId || '', title, content, plainTextContent);
  //   // Removed socket.emit for note-title-update and note-update
  // };

  // Handle content changes
  const handleTagsChange = async (selected: any) => {
    // selected is an array of { value, label, ... }
    const values = selected ? selected.map((opt: any) => opt.value) : [];
    setSelectedTags(values);
    if (noteId) {
      try {
        await updateItem(noteId || '', { tags: values });
        setItem(prev => {
          if (!prev) return null;
          if (Array.isArray(prev.tags) && prev.tags.length > 0 && typeof prev.tags[0] === 'string') {
            // tags are string[]
            return { ...prev, tags: values };
          } else {
            // tags are object[]
            return {
              ...prev,
              tags: tags.filter(t => values.includes(typeof t === 'string' ? t : (t && typeof t === 'object' && '_id' in t ? t._id : ''))),
            };
          }
        });
      } catch (err) {
      }
    }
  };

  const handleCreateTag = async (inputValue: string) => {
    try {
      const newTag = await createTag({ name: inputValue });
      setSelectedTags(prev => [...prev, newTag._id]);
      if (noteId) {
        await updateItem(noteId || '', { tags: [...selectedTags, newTag._id] });
        setItem(prev => {
          if (!prev) return null;
          if (Array.isArray(prev.tags) && prev.tags.length > 0 && typeof prev.tags[0] === 'string') {
            // tags are string[]
            return { ...prev, tags: [...selectedTags, newTag._id] };
          } else {
            // tags are object[]
            return {
              ...prev,
              tags: tags.filter(t => [...selectedTags, newTag._id].includes(typeof t === 'string' ? t : (t && typeof t === 'object' && '_id' in t ? t._id : ''))),
            };
          }
        });
      }
    } catch (err) {
    }
  };

  const handleNotebookChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedNotebook(value);
    if (noteId) {
      try {
        await updateItem(noteId || '', { primaryNotebookId: value });
        setItem(prev => {
          if (!prev) return null;
          const found = notebooks.find(nb => nb._id === value);
          return found ? { ...prev, primaryNotebookId: found } : prev;
        });
      } catch (err) {
      }
    }
  };



  const handleAddCollaborator = async () => {
    setSharingError('');
    try {
      // For demo: use email as userId (in real app, lookup userId by email)
      if (noteId && addCollaborator) {
        await addCollaborator?.(noteId || '', collabEmail, collabPermission);
      }
      setColabEmail('');
      setColabPermission('read');
      // Optionally reload item
      if (noteId) fetchItem(noteId || '');
    } catch (err) {
      setSharingError('Failed to add collaborator');
    }
  };

  const handleUpdatePermission = async (userId: string, permission: string) => {
    try {
      if (noteId && updateCollaborator) {
        await updateCollaborator?.(noteId || '', userId, permission);
      }
      if (noteId) fetchItem(noteId || '');
    } catch (err) {
      setSharingError('Failed to update permission');
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      if (noteId && removeCollaborator) {
        await removeCollaborator?.(noteId || '', userId);
      }
      if (noteId) fetchItem(noteId || '');
    } catch (err) {
      setSharingError('Failed to remove collaborator');
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !item) return;
    setUploading(true);
    setUploadError(null);
    try {
      if (item && item._id && uploadAttachment) {
        await uploadAttachment?.(item._id || '', e.target.files[0]);
      }
      // Refetch item to update attachments
      if (noteId) fetchItem(noteId || '');
    } catch (err) {
      setUploadError('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Handle remove attachment
  const handleRemoveAttachment = async (filename: string) => {
    if (!item) return;
    setUploading(true);
    setUploadError(null);
    try {
      if (item && item._id && removeAttachment) {
        await removeAttachment?.(item._id || '', filename);
      }
      if (noteId) fetchItem(noteId || '');
    } catch (err) {
      setUploadError('Failed to remove attachment');
    } finally {
      setUploading(false);
    }
  };

  // Close modal on outside click
  useEffect(() => {
    if (!shareModalOpen) return;
    function handleClick(e: MouseEvent) {
      if (shareModalRef.current && !shareModalRef.current.contains(e.target as Node)) {
        setShareModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareModalOpen]);

  useEffect(() => {
    if (!editorInstance) return;
    const handleFocus = () => setEditorFocused(true);
    const handleBlur = () => setEditorFocused(false);
    const handleSelectionUpdate = () => {
      if (!editorInstance) return;
      const { from, to } = editorInstance.state.selection;
      // Show toolbar if focused or if there is a selection
      setShowToolbar(editorInstance.isFocused || from !== to);
    };
    editorInstance.on('focus', handleFocus);
    editorInstance.on('blur', handleBlur);
    editorInstance.on('selectionUpdate', handleSelectionUpdate);
    // Initial check
    handleSelectionUpdate();
    return () => {
      editorInstance.off('focus', handleFocus);
      editorInstance.off('blur', handleBlur);
      editorInstance.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editorInstance]);

  // Hide toolbar if not focused, no selection, and no popover open
  useEffect(() => {
    if (!editorInstance) return;
    if (!editorFocused && editorInstance.state.selection.from === editorInstance.state.selection.to) {
      setShowToolbar(false);
    }
  }, [editorFocused, editorInstance]);

  useEffect(() => {
    if (!shareDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        shareButtonRef.current &&
        !shareButtonRef.current.contains(e.target as Node) &&
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(e.target as Node)
      ) {
        setShareDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareDropdownOpen]);

  useEffect(() => {
    if (shareDropdownOpen) {
      // Refetch the item and update state when the share dropdown is opened
      if (noteId) {
        fetchItem(noteId || '');
      }
    }
  }, [shareDropdownOpen, noteId, fetchItem]);

  // Helper: is content empty?
  const isContentEmpty = editorInstance ? editorInstance.getHTML().replace(/<[^>]*>/g, '').trim() === '' : true;

  // Type guards
  function isNote(obj: any): obj is Note {
    return obj && typeof obj === 'object' && 'primaryNotebookId' in obj;
  }
  function isTemplate(obj: any): obj is Template {
    return obj && typeof obj === 'object' && !('primaryNotebookId' in obj);
  }

  const userTemplates = templatesStore.templates.filter(t => !t.isDeleted && t.userId); // adjust as needed for user
  const filteredTemplates = userTemplates.filter(t =>
    t.title.toLowerCase().includes(templateSearch.toLowerCase())
  );
  const selectedTemplate = userTemplates.find(t => t._id === selectedTemplateId);

  useEffect(() => {
    if (showTemplateModal) {
      templatesStore.fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTemplateModal]);

  // --- Yjs Collaboration Setup ---
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yTitle, setYTitle] = useState<Y.Text | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false); // NEW: for transition state

  // Add a unique sessionId for each note open
  const sessionIdRef = useRef(0);
  useEffect(() => {
    sessionIdRef.current += 1;
  }, [noteId]);

  // Add a ref to track the latest active noteId
  const activeNoteIdRef = useRef(noteId);
  useEffect(() => {
    activeNoteIdRef.current = noteId;
  }, [noteId]);

  // --- Create Yjs doc/provider as soon as noteId is available ---
  useEffect(() => {
    if (!noteId) return;
    const ydocInstance = new Y.Doc();
    // Apply canonical Yjs update from backend if present
    if (item && 'yjsUpdate' in item && typeof item.yjsUpdate === 'string' && item.yjsUpdate) {
      try {
        const update = Uint8Array.from(atob(item.yjsUpdate || ''), c => c.charCodeAt(0));
        Y.applyUpdate(ydocInstance, update);
        console.log('[YJS DEBUG] Applied canonical Yjs update for note:', noteId || '');
      } catch (e) {
        console.error('[YJS ERROR] Failed to apply canonical Yjs update:', e);
      }
    } else if (item && 'fallbackContent' in item && typeof item.fallbackContent === 'string' && item.fallbackContent) {
      // If no Yjs update, initialize Yjs doc with fallbackContent (HTML)
      // This requires converting HTML to ProseMirror JSON, then inserting into ydocInstance
      // You may need to import your htmlToProseMirrorJSON utility here if available in frontend
      // For now, just log a warning
      console.warn('[YJS WARNING] No Yjs update found, fallbackContent present. Editor should convert HTML to ProseMirror JSON and insert into Yjs doc.');
      // Example (pseudo-code):
      // const pmJson = htmlToProseMirrorJSON(item.fallbackContent);
      // const yXml = ydocInstance.getXmlFragment('prosemirror');
      // yXml.insert(0, pmJson.content);
    }
    const providerInstance = new WebsocketProvider('ws://localhost:3001', `note-${noteId}`, ydocInstance);
    setYdoc(ydocInstance);
    setProvider(providerInstance);
    return () => {
      providerInstance.destroy();
      ydocInstance.destroy();
      setYdoc(null);
      setProvider(null);
    };
  }, [noteId, item]);

  // --- Attach Yjs observers for title/content when editorInstance, ydoc, and provider are ready ---
  useEffect(() => {
    if (!noteId || !editorInstance || !ydoc || !provider || isTransitioning) return;
    const currentSessionId = sessionIdRef.current;
    const yTitle = ydoc.getXmlFragment('title');
    // Only set if yTitle is a Y.Text (not Y.XmlFragment)
    if (yTitle instanceof Y.Text) {
      setYTitle(yTitle);
    }
    setTitleValue(yTitle.toString());

    const { updateNote: updateNoteInStore } = useNotesStore.getState();
    // --- Title observer ---
    const updateTitle = () => {
      if (sessionIdRef.current !== currentSessionId) return; // Only for current session
      if (!yjsReady) return; // Only update DB if Yjs is ready
      if (noteId !== activeNoteIdRef.current) return; // Only update store for current note
      if (initializingTitleRef.current) return; // Prevent store/DB update during initialization
      const newTitle = yTitle.toString();
      setTitleValue(newTitle);
      if (item && newTitle !== item.title) {
        if (typeof autoSaveItem === 'function') {
          autoSaveItem(noteId || '', newTitle);
        } else if (typeof updateItem === 'function') {
          updateItem(noteId || '', { title: newTitle });
        }
      }
    };
    yTitle.observe(updateTitle);

    // --- Content observer ---
    const yXml = ydoc.getXmlFragment('prosemirror');
    const updateContent = () => {
      if (sessionIdRef.current !== currentSessionId) return;
      if (!yjsReady) return;
      if (noteId !== activeNoteIdRef.current) return;
      if (editorInstance && typeof editorInstance.getHTML === 'function') {
        const html = editorInstance.getHTML();
        // Debounce content saves (2s after last keystroke)
        if (noteEditorDebounceTimeout) {
          clearTimeout(noteEditorDebounceTimeout);
        }
        noteEditorDebounceTimeout = setTimeout(() => {
          if (typeof autoSaveItem === 'function') {
            autoSaveItem(noteId || '', titleValue);
          } else if (typeof updateItem === 'function') {
            updateItem(noteId || '', { title: titleValue });
          }
          updateNoteInStore(noteId || '', { title: titleValue });
        }, 2000); // 2s debounce
      }
    };
    yXml.observeDeep(updateContent);

    // Set Yjs ready after initial content/title is set
    setTimeout(() => setYjsReady(true), 200);

    return () => {
      yTitle.unobserve(updateTitle);
      yXml.unobserveDeep(updateContent);
    };
  }, [noteId, editorInstance, ydoc, provider, isTransitioning]);

  // Add this useEffect to ensure yTitle is set as soon as ydoc is available
  useEffect(() => {
    if (ydoc) {
      const yTitle = ydoc.getXmlFragment('title');
      if (yTitle instanceof Y.Text) {
        setYTitle(yTitle);
      }
    }
  }, [ydoc]);

  // Listen for Yjs provider sync and observe the Y.Text for title
  useEffect(() => {
    if (!ydoc || !noteId) return;
    const yTitle = ydoc.getXmlFragment('title');
    const update = () => setTitleValue(yTitle.toString());
    yTitle.observe(update);
    // Initial update
    setTitleValue(yTitle.toString());
    return () => {
      yTitle.unobserve(update);
    };
  }, [ydoc, noteId]);

  // --- Yjs Collaboration Debug: Log when Yjs doc receives updates (from any tab) ---
  useEffect(() => {
    if (!ydoc || !editorInstance) return;
    const handleYjsUpdate = (update: Uint8Array, origin: any) => {
      // This event fires for both local and remote updates
      console.log('[YJS DEBUG] Yjs doc update received for note:', noteId || '', 'Origin:', origin);
      if (editorInstance && typeof editorInstance.getHTML === 'function') {
        const html = editorInstance.getHTML();
        console.log('[YJS DEBUG] Editor content after Yjs update for note:', noteId || '', 'HTML:', html);
      }
    };
    ydoc.on('update', handleYjsUpdate);
    return () => {
      ydoc.off('update', handleYjsUpdate);
    };
  }, [ydoc, editorInstance, noteId]);

  // Remove all local state and handlers related to the old input title logic (localTitleValue, isTypingTitle, titleUpdateTimeoutRef, handleTitleChange, etc.)

  // Reset initialTitleSetRef when noteId changes
  useEffect(() => {
    initialTitleSetRef.current = false;
  }, [noteId]);

  // Debounced function to update Yjs title
  const debouncedUpdateYTitle = useRef(
    debounce((yTitle, value) => {
      if (yTitle) {
        yTitle.delete(0, yTitle.length);
        yTitle.insert(0, value);
      }
    }, 200)
  ).current;

  // TITLE-ONLY: Initialize local title state when item loads
  useEffect(() => {
    if (!item) return;
    const initialTitle = item.title || 'Untitled';
    setTitleValue(initialTitle);
  }, [item]);

  // TITLE-ONLY: Update Yjs observer for title to prevent updates while typing
  useEffect(() => {
    if (!yTitle) return;
    const currentSessionId = sessionIdRef.current;
    const updateTitle = () => {
      if (sessionIdRef.current !== currentSessionId) return;
      if (!yjsReady) return;
      if (noteId !== activeNoteIdRef.current) return;
      if (initializingTitleRef.current) return;
      const newTitle = yTitle.toString();
      if (newTitle !== item?.title) {
        updateItem(noteId || '', { title: newTitle });
      }
    };
    yTitle.observe(updateTitle);
    return () => yTitle.unobserve(updateTitle);
  }, [yTitle, item, noteId, yjsReady, updateItem]);

  // 2. Only show spinner if loading, item is null, or isTransitioning
  if (loading || !item || isTransitioning) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white-900">Loading item...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white-900 mb-2">Error</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Item not found</h3>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Only render editor if content is loaded and ydoc/provider are ready
  if (typeof content !== 'string' || !ydoc || !provider) {
    return null;
  }

  // Pass yjsUpdate to RichTextEditor
  return (
    <div className={
      (isFullScreen ? "fixed inset-0 z-50 bg-[#181818] flex flex-col" : "flex-1 flex flex-col bg-[#181818] h-full") +
      (isCollapsed ? " w-full" : "") +
      " transition-opacity duration-300 opacity-100 animate-fade-in"
    }>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#232323] bg-[#181818] shadow-sm">
        {/* Left: Navigation, Controls, and Title */}
        <div className="flex items-center gap-3 flex-1">
          {/* Collapse/Expand Preview Button */}
          {!shared && (
            <button
              onClick={handleCollapseToggle}
              className="p-2 flex items-center justify-center rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-200 border border-[#333]"
              aria-label={isCollapsed ? 'Show preview' : 'Hide preview'}
            >
              {isCollapsed ? <ChevronRight size={18} className="text-gray-300" /> : <ChevronLeft size={18} className="text-gray-300" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullScreen(f => !f)}
            className="p-2 flex items-center justify-center rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all duration-200 border border-[#333] text-gray-300"
            aria-label="Expand item"
            disabled={readOnly}
          >
            <Maximize2 size={18} />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#333] mx-2"></div>

          {/* Notebook Info */}
          {type === 'note' && !readOnly && (
            <button
              onClick={() => setMoveModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#333] transition-colors cursor-pointer"
              title="Manage notebooks"
            >
              <Book size={16} className="text-gray-400" />
              <span className="text-gray-200 text-sm font-medium">
                {(() => {
                  if (item && 'notebookIds' in item && item.notebookIds && item.notebookIds.length > 0) {
                    const notebookNames = item.notebookIds.map(notebookId => {
                      if (typeof notebookId === 'object' && 'name' in notebookId) {
                        return notebookId.name;
                      } else if (typeof notebookId === 'string') {
                        const notebook = notebooks.find(nb => nb._id === notebookId);
                        return notebook ? notebook.name : 'Unknown';
                      }
                      return 'Unknown';
                    }).filter(name => name !== 'Unknown');
                    
                    if (notebookNames.length === 0) {
                      return 'No Notebooks';
                    } else if (notebookNames.length === 1) {
                      return notebookNames[0];
                    } else {
                      return `${notebookNames[0]} +${notebookNames.length - 1}`;
                    }
                  }
                  return 'No Notebooks';
                })()}
              </span>
            </button>
          )}
          {type === 'note' && readOnly && item && 'notebookIds' in item && item.notebookIds && item.notebookIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#333]">
              <Book size={16} className="text-gray-400" />
              <span className="text-gray-200 text-sm font-medium">
                {(() => {
                  const notebookNames = item.notebookIds.map(notebookId => {
                    if (typeof notebookId === 'object' && 'name' in notebookId) {
                      return notebookId.name;
                    } else if (typeof notebookId === 'string') {
                      const notebook = notebooks.find(nb => nb._id === notebookId);
                      return notebook ? notebook.name : 'Unknown';
                    }
                    return 'Unknown';
                  }).filter(name => name !== 'Unknown');
                  
                  if (notebookNames.length === 0) {
                    return 'No Notebooks';
                  } else if (notebookNames.length === 1) {
                    return notebookNames[0];
                  } else {
                    return `${notebookNames[0]} +${notebookNames.length - 1}`;
                  }
                })()}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-[#333] mx-2"></div>

          {/* Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText size={18} className="text-gray-400 flex-shrink-0" />
            {!editingTitle ? (
              <button
                className="text-left truncate bg-transparent border-none outline-none focus:outline-none text-white text-lg font-semibold flex-1"
                style={{ cursor: 'pointer' }}
                title="Move note"
                onClick={() => setMoveModalOpen(true)}
              >
                {titleValue || 'Untitled'}
              </button>
            ) : (
            <MinimalTitleEditor
              ydoc={ydoc}
              provider={provider}
              initialTitle={item?.title || ''}
              readOnly={readOnly}
              onTitleChange={title => {
                if (item && item.title !== title) {
                  updateItem(noteId || '', { title });
                }
                  setTitleValue(title);
                }}
              />
            )}
            {!readOnly && !editingTitle && (
              <button
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                title="Edit title"
                onClick={() => setEditingTitle(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6" />
                </svg>
              </button>
            )}
            {editingTitle && (
              <button
                className="text-gray-400 hover:text-white p-1 rounded transition-colors ml-1"
                title="Done editing"
                onClick={() => setEditingTitle(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        {!readOnly && (
          <div className="flex items-center gap-3">
            {/* Share Button Group */}
            <div className="flex items-center">
              <ShareButton
                noteId={noteId || ''}
                noteTitle={titleValue}
                className="rounded-l-lg rounded-r-none bg-[#818cf8] hover:bg-[#6366f1] text-black px-4 h-9 border border-[#818cf8] border-r-0 focus:outline-none transition-all duration-200 text-sm font-medium flex items-center gap-2"
                open={shareDropdownOpen}
                setOpen={setShareDropdownOpen}
                ref={shareButtonRef}
                dropdownRef={shareDropdownRef}
                onShareChange={() => {
                  if (noteId) {
                    fetchItem(noteId || '');
                  }
                }}
              />
              <button
                className="rounded-r-lg rounded-l-none bg-[#818cf8] hover:bg-[#6366f1] text-black px-3 h-9 border border-[#818cf8] border-l border-l-white/20 focus:outline-none transition-all duration-200 flex items-center justify-center"
                title="Copy note link"
                onClick={async () => {
                  const link = generateShareLink(noteId || '');
                  const success = await copyToClipboard(link);
                  showToast(success ? 'Link copied!' : 'Failed to copy link', success ? 'success' : 'error');
                }}
              >
                <Link className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* More Menu */}
            <NoteMoreMenu noteId={noteId || ''} setShareDropdownOpen={setShareDropdownOpen} setMoveModalOpen={setMoveModalOpen} />
          </div>
        )}
      </div>
      {/* Fixed toolbar */}
      {!readOnly && (
        <div className="bg-[#181818] border-b border-[#232323] min-w-0 w-full">
          <EditorToolbar editor={editorInstance} />
        </div>
      )}
      {/* Fixed title */}
      {!readOnly && (
        <div className="bg-[#181818] px-4 text-2xl font-semibold h-10 border-b border-[#232323]">
          <MinimalTitleEditor
            ydoc={ydoc}
            provider={provider}
            initialTitle={item?.title || ''}
            readOnly={readOnly}
            onTitleChange={title => {
              // Optionally, update the backend or local store if needed
              if (item && item.title !== title) {
                updateItem(noteId || '', { title });
              }
            }}
          />
        </div>
      )}
      {readOnly && (
        <div className="bg-[#181818] border-b border-[#232323]">
          <input
            type="text"
            value={titleValue}
            readOnly
            disabled
            placeholder="Title"
            className="overflow-hidden w-full text-3xl font-medium text-[#fff] placeholder-[#888] bg-transparent border-none outline-none focus:outline-none focus:border-none focus:ring-0 focus:ring-transparent cursor-default px-6 py-4"
            style={{ letterSpacing: '-0.02em' }}
          />
        </div>
      )}
      {/* Scrollable text editor area only */}
      <div className="flex-1 overflow-y-auto min-w-0 w-full scrollbar-hide">
        <RichTextEditor 
          noteId={noteId || ''}
          readOnly={readOnly}
          hideToolbar={true}
          onEditorReady={setEditorInstance}
          initialContent={content}
          ydoc={ydoc}
          provider={provider}
          yjsUpdate={item && (item as any).yjsUpdate}
        />
        {/* Item Content */}
        <div id="item-print-content" className="relative">
          {(!readOnly && isContentEmpty) && (
            <div
              className="absolute left-1/2 z-20"
              style={{ top: '30%', transform: 'translateX(-50%)' }}
            >
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#232323] text-white hover:bg-[#353A40] focus:outline-none text-base font-medium shadow border border-[#353A40] opacity-95 backdrop-blur"
                onClick={() => setShowTemplateModal(true)}
              >
                <FileText className="w-5 h-5" />
                My templates
              </button>
            </div>
          )}
        </div>
        {/* Backlinks Section */}
        {backlinks.length > 0 && (
          <div className="mt-4 p-3 bg-gray-700 rounded border border-gray-600">
            <div className="font-semibold text-gray-300 mb-2">Linked from:</div>
            <ul className="list-disc pl-5">
              {backlinks.map(link => (
                <li key={link._id}>
                  <a href={`?item=${link._id}`} className="text-blue-400 hover:underline">{link.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>


      {/* Sharing Section - now in modal */}
      {!readOnly && shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div ref={shareModalRef} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
            <div className="font-semibold text-lg text-gray-700 mb-4 flex items-center gap-2">
              <Share className="w-5 h-5 text-blue-500" /> Share this item
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={collabEmail}
                onChange={e => setColabEmail(e.target.value)}
                placeholder="Collaborator email or username"
                className="border rounded px-2 py-1 text-sm flex-1"
              />
              <select
                value={collabPermission}
                onChange={e => setColabPermission(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="read">Read</option>
                <option value="write">Edit</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                onClick={handleAddCollaborator}
                type="button"
                disabled={!collabEmail}
              >
                Add
              </button>
            </div>
            {sharingError && <div className="text-xs text-red-500 mb-2">{sharingError}</div>}
            {item.collaborators && item.collaborators.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Collaborators:</div>
                <ul>
                  {item.collaborators.map((c: any) => (
                    <li key={c.userId} className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-700">{typeof c.userId === 'object' ? c.userId.email || c.userId.name || c.userId._id : c.userId}</span>
                      <select
                        value={c.permission}
                        onChange={e => handleUpdatePermission(c.userId, e.target.value)}
                        className="border rounded px-1 py-0.5 text-xs"
                      >
                        <option value="read">Read</option>
                        <option value="write">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="text-xs text-red-500 ml-2"
                        onClick={() => handleRemoveCollaborator(c.userId)}
                        type="button"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#181818] rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setMoveModalOpen(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="text-gray-300" />
              <span className="text-white text-xl font-semibold">Manage Notebooks</span>
              <span className="text-gray-400">{titleValue || "Untitled"}</span>
            </div>
            
            {/* Current Notebooks */}
            {item && 'notebookIds' in item && item.notebookIds && item.notebookIds.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white text-sm font-medium mb-3">Current Notebooks:</h3>
                <div className="space-y-2">
                  {item.notebookIds.map((notebookId, index) => {
                    const notebookName = typeof notebookId === 'object' && 'name' in notebookId 
                      ? notebookId.name 
                      : typeof notebookId === 'string' 
                        ? notebooks.find(nb => nb._id === notebookId)?.name || 'Unknown'
                        : 'Unknown';
                    const isPrimary = typeof item.primaryNotebookId === 'object' && 'name' in item.primaryNotebookId
                      ? item.primaryNotebookId.name === notebookName
                      : typeof item.primaryNotebookId === 'string'
                        ? item.primaryNotebookId === notebookId
                        : false;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#232323] rounded-lg">
                        <div className="flex items-center gap-2">
                          <Book className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">{notebookName}</span>
                          {isPrimary && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Primary</span>
                          )}
                        </div>
                                                 <button
                           onClick={async () => {
                             if (noteId && isNote(item)) {
                               const currentNotebookIds = item.notebookIds.filter((_, i) => i !== index);
                               await updateItem(noteId || '', { notebookIds: currentNotebookIds });
                               
                               // Refresh the item data
                               try {
                                 const updatedItem = await fetchItem(noteId || '');
                                 setItem(updatedItem);
                               } catch (error) {
                                 console.error('Failed to refresh item after removing notebook:', error);
                               }
                             }
                           }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove from this notebook"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Add to Notebook */}
            <div className="mb-6">
              <h3 className="text-white text-sm font-medium mb-3">Add to Notebook:</h3>
            <input
              type="text"
              value={moveSearch}
              onChange={e => setMoveSearch(e.target.value)}
                placeholder="Search notebooks..."
              className="w-full mb-4 px-3 py-2 rounded bg-[#232323] text-white border border-[#333] focus:outline-none"
            />
              <div className="max-h-40 overflow-y-auto">
                {notebooks
                  .filter(nb => nb.name.toLowerCase().includes(moveSearch.toLowerCase()))
                                     .filter(nb => !(isNote(item) && item.notebookIds?.some((notebookId: any) => 
                     typeof notebookId === 'object' && 'name' in notebookId 
                       ? notebookId.name === nb.name
                       : typeof notebookId === 'string' 
                         ? notebookId === nb._id
                         : false
                   )))
                  .map(nb => (
                <button
                      key={nb._id}
                      className="w-full flex items-center gap-2 px-4 py-2 rounded text-left transition-colors text-white hover:bg-[#232323]"
                                             onClick={async () => {
                         if (noteId && isNote(item)) {
                           const currentNotebookIds = item.notebookIds || [];
                           const newNotebookIds = [...currentNotebookIds, nb._id];
                           await updateItem(noteId || '', { notebookIds: newNotebookIds });
                           
                           // Refresh the item data
                           try {
                             const updatedItem = await fetchItem(noteId || '');
                             setItem(updatedItem);
                           } catch (error) {
                             console.error('Failed to refresh item after adding notebook:', error);
                           }
                           
                           setMoveSearch('');
                         }
                       }}
                >
                  <Book className="w-4 h-4" />
                      <span>{nb.name}</span>
                      <div className="ml-auto text-blue-400 text-sm">+ Add</div>
                </button>
              ))}
            </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-[#232323] text-white hover:bg-[#333]"
                onClick={() => {
                      setMoveModalOpen(false);
                  setMoveSearch('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-lg p-0 relative animate-fade-in border border-[#232323]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232323]">
              <h2 className="text-lg font-semibold text-white">Choose a template to start with</h2>
              <button className="text-gray-400 hover:text-white p-1" onClick={() => setShowTemplateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-[#232323]">
              <div className="relative">
                <input
                  type="text"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Find template"
                  className="w-full pl-10 pr-4 py-2 rounded bg-[#232323] text-white placeholder-gray-400 border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#818cf8]"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </div>
            {/* Templates List */}
            <div className="px-6 py-2 max-h-64 overflow-y-auto">
              {filteredTemplates.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No templates found</div>
              ) : (
                <ul>
                  {filteredTemplates.map(t => (
                    <li
                      key={t._id}
                      className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-colors ${selectedTemplateId === t._id ? 'bg-[#232323] text-white' : 'hover:bg-[#232323] text-gray-200'}`}
                      onClick={() => setSelectedTemplateId(t._id)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="flex-1">{t.title}</span>
                      {t.isPinned && <Pin className="w-4 h-4 text-[#818cf8]" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#232323]">
              <button
                className="px-4 py-2 rounded bg-[#232323] text-white hover:bg-[#353A40] border border-[#353A40]"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded bg-[#818cf8] text-black font-semibold transition-colors ${!selectedTemplateId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#6366f1]'}`}
                disabled={!selectedTemplateId}
                onClick={() => {
                  if (selectedTemplate) {
                    setTitleValue(selectedTemplate.title || '');
                    autoSaveItem(noteId || '', selectedTemplate.title || '');
                    setShowTemplateModal(false);
                  }
                }}
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Add Tag button */}
      {!readOnly && (
        <div className="editor-footer flex items-center gap-6 p-2 border-t border-[#232323] bg-[#181818] min-w-0 w-full" style={{ height: 40 }}>
          <button
            className="flex items-center gap-2 text-gray-400 hover:text-white focus:outline-none group relative"
            onClick={() => {/* TODO: Implement add tag modal */ }}
            type="button"
            aria-label="Add tag"
          >
            <span className="relative inline-block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.59 13.41a2 2 0 0 0 0-2.82l-7.18-7.18a2 2 0 0 0-2.82 0l-5.18 5.18a2 2 0 0 0 0 2.82l7.18 7.18a2 2 0 0 0 2.82 0l5.18-5.18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" className="absolute -bottom-1 -right-1" fill="none">
                <circle cx="5" cy="5" r="5" fill="#232323" />
                <path d="M5 2v6M2 5h6" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="ml-2 text-gray-400 group-hover:text-white">Add tag</span>
          </button>
        </div>
      )}
    </div>
  );
};