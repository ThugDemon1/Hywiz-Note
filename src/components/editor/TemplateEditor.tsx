import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Maximize2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { TemplateEditorToolbar } from './EditorToolbar';
import { useTemplatesStore } from '../../stores/useTemplatesStore';
import { Template } from '../../stores/useTemplatesStore';
import { useUIStore } from '../../stores/useUIStore';
import { TemplateShareButton } from './TemplateShareButton';
import { NoteMoreMenu } from '../notes/NoteMoreMenu';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import debounce from 'lodash.debounce';

interface TemplateEditorProps {
  templateId: string;
  onClose: () => void;
  readOnly?: boolean;
  templatesListCollapsed?: boolean;
  setTemplatesListCollapsed?: (collapsed: boolean) => void;
  shared?: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ templateId, onClose, readOnly = false, templatesListCollapsed, setTemplatesListCollapsed, shared }) => {
  const templatesStore = useTemplatesStore();
  const { openImportExportModal } = useUIStore();
  const [template, setTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [editor, setEditor] = useState<any>(null);
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const isCollapsed = typeof templatesListCollapsed === 'boolean' ? templatesListCollapsed : localCollapsed;
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yjsReady, setYjsReady] = useState(false);
  const [yTitle, setYTitle] = useState<Y.Text | null>(null);

  // Add session management like NoteEditor
  const sessionIdRef = useRef(0);
  useEffect(() => {
    sessionIdRef.current += 1;
  }, [templateId]);

  // Add a ref to track the latest active templateId
  const activeTemplateIdRef = useRef(templateId);
  useEffect(() => {
    activeTemplateIdRef.current = templateId;
  }, [templateId]);

  // Add a ref to track if we're initializing the Yjs title from the DB
  const initializingTitleRef = useRef(true);
  // Add a ref to track the last initialized templateId
  const lastInitializedTemplateIdRef = useRef<string | null>(null);
  const initialTitleSetRef = useRef(false);

  // Fetch template data
  useEffect(() => {
    console.log('[YJS DEBUG] Template loading effect running for templateId:', templateId);
    if (!templateId) return;
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await templatesStore.fetchTemplate(templateId);
        setTemplate(data);
        setTitle(data.title || '');
        setContent(data.content || '');
      } catch (error) {
        setError('Failed to load template. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadTemplate();
  }, [templateId]);

  // --- Create Yjs doc/provider as soon as templateId is available ---
  useEffect(() => {
    console.log('[YJS DEBUG] YDoc creation effect running for templateId:', templateId);
    if (!templateId) return;
    
    const ydocInstance = new Y.Doc();
    const providerInstance = new WebsocketProvider('ws://localhost:3001', `template-${templateId}`, ydocInstance);
    setYdoc(ydocInstance);
    setProvider(providerInstance);
    
    return () => {
      console.log('[YJS DEBUG] Cleaning up YDoc for template:', templateId);
      providerInstance.destroy();
      ydocInstance.destroy();
      setYdoc(null);
      setProvider(null);
    };
  }, [templateId]);

  // Reset state when templateId changes
  useEffect(() => {
    console.log('[YJS DEBUG] State reset effect running for templateId:', templateId);
    initialTitleSetRef.current = false;
    setYjsReady(false);
    setYTitle(null);
    setEditor(null);
    lastInitializedTemplateIdRef.current = null;
  }, [templateId]);

  // Apply Yjs update when template data is available
  useEffect(() => {
    if (!template || !ydoc) return;
    
    // Apply canonical Yjs update from backend if present
    if ('yjsUpdate' in template && typeof template.yjsUpdate === 'string' && template.yjsUpdate) {
      try {
        const update = Uint8Array.from(atob(template.yjsUpdate || ''), c => c.charCodeAt(0));
        Y.applyUpdate(ydoc, update);
        console.log('[YJS DEBUG] Applied canonical Yjs update for template:', template._id);
      } catch (e) {
        console.error('[YJS ERROR] Failed to apply canonical Yjs update for template:', e);
      }
    } else if ('fallbackContent' in template && typeof template.fallbackContent === 'string' && template.fallbackContent) {
      // If no Yjs update, initialize Yjs doc with fallbackContent (HTML)
      console.warn('[YJS WARNING] No Yjs update found, fallbackContent present. Editor should convert HTML to ProseMirror JSON and insert into Yjs doc.');
    }
  }, [template, ydoc]);

  // TITLE-ONLY: Initialize local title state when template loads
  useEffect(() => {
    if (!template) return;
    const initialTitle = template.title || 'Untitled';
    setTitle(initialTitle);
  }, [template]);

  // Debounced function to update Yjs title
  const debouncedUpdateYTitle = useRef(
    debounce((yTitle: Y.Text | null, value: string) => {
      if (yTitle) {
        yTitle.delete(0, yTitle.length);
        yTitle.insert(0, value);
      }
    }, 200)
  ).current;

  // --- Attach Yjs observers for title/content when editorInstance, ydoc, and provider are ready ---
  useEffect(() => {
    console.log('[YJS DEBUG] Observer setup effect running:', { templateId, hasEditor: !!editor, hasYdoc: !!ydoc, hasProvider: !!provider });
    if (!templateId || !editor || !ydoc || !provider) return;
    
    // Prevent multiple setups for the same template
    if (lastInitializedTemplateIdRef.current === templateId) {
      console.log('[YJS DEBUG] Observers already set up for template:', templateId);
      return;
    }
    
    console.log('[YJS DEBUG] Setting up observers for template:', templateId);
    lastInitializedTemplateIdRef.current = templateId;
    const currentSessionId = sessionIdRef.current;
    const yTitleFragment = ydoc.getXmlFragment('title');
    // Only set if yTitle is a Y.Text (not Y.XmlFragment)
    if (yTitleFragment instanceof Y.Text) {
      setYTitle(yTitleFragment);
    }
    setTitle(yTitleFragment.toString());

    // --- Title observer ---
    const updateTitle = () => {
      if (sessionIdRef.current !== currentSessionId) return; // Only for current session
      if (!yjsReady) return; // Only update DB if Yjs is ready
      if (templateId !== activeTemplateIdRef.current) return; // Only update store for current template
      if (initializingTitleRef.current) return; // Prevent store/DB update during initialization
      const newTitle = yTitleFragment.toString();
      setTitle(newTitle);
      if (template && newTitle !== template.title) {
        templatesStore.updateTemplate(templateId, { title: newTitle });
      }
    };
    yTitleFragment.observe(updateTitle);

    // --- Content observer ---
    const yXml = ydoc.getXmlFragment('prosemirror');
    const updateContent = () => {
      if (sessionIdRef.current !== currentSessionId) return;
      if (!yjsReady) return;
      if (templateId !== activeTemplateIdRef.current) return;
      if (editor && typeof editor.getHTML === 'function') {
        const html = editor.getHTML();
        // Debounce content saves (2s after last keystroke)
        if (templateEditorDebounceTimeoutRef.current) {
          clearTimeout(templateEditorDebounceTimeoutRef.current);
        }
        templateEditorDebounceTimeoutRef.current = setTimeout(() => {
          templatesStore.updateTemplate(templateId, { content: html });
        }, 2000); // 2s debounce
      }
    };
    yXml.observeDeep(updateContent);

    // Set Yjs ready after initial content/title is set
    setTimeout(() => setYjsReady(true), 200);

    return () => {
      yTitleFragment.unobserve(updateTitle);
      yXml.unobserveDeep(updateContent);
      if (templateEditorDebounceTimeoutRef.current) {
        clearTimeout(templateEditorDebounceTimeoutRef.current);
      }
    };
  }, [templateId, editor, ydoc, provider]);

  // TITLE-ONLY: Update Yjs observer for title to prevent updates while typing
  useEffect(() => {
    console.log('[YJS DEBUG] YTitle observer effect running:', { hasYTitle: !!yTitle, templateId, yjsReady });
    if (!yTitle) return;
    const currentSessionId = sessionIdRef.current;
    const updateTitle = () => {
      if (sessionIdRef.current !== currentSessionId) return;
      if (!yjsReady) return;
      if (templateId !== activeTemplateIdRef.current) return;
      if (initializingTitleRef.current) return;
      const newTitle = yTitle.toString();
      if (newTitle !== template?.title) {
        templatesStore.updateTemplate(templateId, { title: newTitle });
      }
    };
    yTitle.observe(updateTitle);
    return () => yTitle.unobserve(updateTitle);
  }, [yTitle, template, templateId, yjsReady, templatesStore]);

  // Add debounce timeout ref
  const templateEditorDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to save canonical YJS update
  const saveCanonicalYjsUpdate = useCallback(async () => {
    if (!ydoc || !templateId) return;
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64 = btoa(String.fromCharCode(...update));
      await templatesStore.updateTemplateYjsUpdate(templateId, base64);
      console.log('[YJS DEBUG] Canonical Yjs update saved for template:', templateId);
    } catch (e) {
      console.error('[YJS ERROR] Failed to save canonical Yjs update for template:', e);
    }
  }, [ydoc, templateId, templatesStore]);

  // Periodic save of canonical YJS update
  useEffect(() => {
    if (!ydoc || !templateId || !yjsReady) return;
    
    const interval = setInterval(() => {
      saveCanonicalYjsUpdate();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [ydoc, templateId, yjsReady, saveCanonicalYjsUpdate]);

  // Save on page unload
  useEffect(() => {
    if (!ydoc || !templateId || !yjsReady) return;
    
    const handleBeforeUnload = () => {
      saveCanonicalYjsUpdate();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [ydoc, templateId, yjsReady, saveCanonicalYjsUpdate]);

  // Handle title changes (only for input field, YDoc handles the rest)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (yTitle) {
      debouncedUpdateYTitle(yTitle, newTitle);
    }
  };

  const handleCollapseToggle = () => {
    if (typeof setTemplatesListCollapsed === 'function') {
      setTemplatesListCollapsed(!isCollapsed);
    } else {
      setLocalCollapsed(v => !v);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      console.log('[YJS DEBUG] TemplateEditor unmounting, cleaning up all resources');
      if (templateEditorDebounceTimeoutRef.current) {
        clearTimeout(templateEditorDebounceTimeoutRef.current);
      }
      if (debouncedUpdateYTitle) {
        debouncedUpdateYTitle.cancel();
      }
      // Clean up YDoc and provider
      if (provider) {
        provider.destroy();
      }
      if (ydoc) {
        ydoc.destroy();
      }
    };
  }, [provider, ydoc]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Only render editor if content is loaded and ydoc/provider are ready
  if (typeof content !== 'string' || !ydoc || !provider) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white-900">Loading template editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 bg-[#181818] flex flex-col min-w-0 w-full overflow-hidden" : "flex-1 flex flex-col bg-[#181818] h-full min-w-0 w-full overflow-hidden" + (isCollapsed ? " w-full" : "")}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#232323] bg-[#181818] min-w-0 w-full">
        <div className="flex items-center gap-4">
          {/* Collapse/Expand Button */}
          {!shared && (
            <button
              onClick={handleCollapseToggle}
              className="p-1 flex items-center justify-center rounded bg-[#323232] hover:bg-[#232323] transition-colors"
              aria-label={isCollapsed ? 'Show preview' : 'Hide preview'}
            >
              {isCollapsed ? <ChevronRight size={22} color="#F3F4F6" /> : <ChevronLeft size={22} color="#F3F4F6" />}
            </button>
          )}
          <button
            onClick={() => setIsFullScreen(f => !f)}
            className="text-[#F3F4F6] bg-[#323232] hover:bg-[#232323] p-1 rounded"
            aria-label="Expand item"
            disabled={readOnly}
          >
            <Maximize2 size={22} />
          </button>
          <div className="flex items-center gap-1">
            <FileText size={20} className="text-gray-300" />
            {readOnly ? (
              <span className="text-white text-lg font-semibold bg-transparent border-none outline-none cursor-default" style={{ textDecoration: 'none' }}>{title || "Untitled"}</span>
            ) : (
              <input
                className="text-white text-lg p-0 font-semibold bg-transparent border-none outline-none cursor-pointer"
                style={{ textDecoration: 'none' }}
                value={title}
                onChange={handleTitleChange}
                placeholder="Template Title"
              />
            )}
          </div>
        </div>
        <div className="flex items-center">
          {!readOnly && <TemplateShareButton templateId={templateId} />}
          {!readOnly && <NoteMoreMenu noteId={templateId} setShareDropdownOpen={() => {}} setMoveModalOpen={() => {}} />}
        </div>
      </div>
      {/* Fixed toolbar */}
      {!readOnly && (
        <div className="bg-[#181818] border-b border-[#232323] min-w-0 w-full">
          <TemplateEditorToolbar editor={editor} />
        </div>
      )}
      {/* Scrollable text editor area only */}
      <div className="flex-1 overflow-y-auto min-w-0 w-full scrollbar-hide">
        <RichTextEditor
          noteId={templateId}
          readOnly={readOnly}
          hideToolbar={true}
          onEditorReady={setEditor}
          ydoc={ydoc!}
          provider={provider!}
          yjsUpdate={template?.yjsUpdate}
          isTemplate={true}
        />
      </div>
      {/* Footer with Add Tag button */}
      {!readOnly && (
        <div className="editor-footer flex items-center gap-6 p-2 border-t border-[#232323] bg-[#181818] min-w-0 w-full" style={{height: 40}}>
          <button
            className="flex items-center gap-2 text-gray-400 hover:text-white focus:outline-none group relative"
            onClick={() => {/* TODO: Implement add tag modal */}}
            type="button"
            aria-label="Add tag"
          >
            <span className="relative inline-block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20.59 13.41a2 2 0 0 0 0-2.82l-7.18-7.18a2 2 0 0 0-2.82 0l-5.18 5.18a2 2 0 0 0 0 2.82l7.18 7.18a2 2 0 0 0 2.82 0l5.18-5.18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>
              </svg>
              <svg width="10" height="10" viewBox="0 0 10 10" className="absolute -bottom-1 -right-1" fill="none">
                <circle cx="5" cy="5" r="5" fill="#232323"/>
                <path d="M5 2v6M2 5h6" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="ml-2 text-gray-400 group-hover:text-white">Add tag</span>
          </button>
        </div>
      )}
    </div>
  );
}; 