import React from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorToolbar } from "./EditorToolbar";
import { CollaborativeHighlight } from "./extensions/CollaborativeHighlight";
import { CollaborativeTextAlign } from "./extensions/CollaborativeTextAlign";
import { CollaborativeColor } from "./extensions/CollaborativeColor";
import { CollaborativeFontSize } from "./extensions/CollaborativeFontSize";
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { CollaborativeTableCellColor } from './extensions/CollaborativeTableCellColor';
import { CollaborativeTableHeaderColor } from './extensions/CollaborativeTableHeaderColor';
import { TableCellMenuOverlay } from './TableCellMenuOverlay';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { tableEditing } from 'prosemirror-tables';
import axios from 'axios';
import api from '../../lib/api';
import debounce from 'lodash.debounce';

interface RichTextEditorProps {
  noteId: string;
  readOnly?: boolean;
  hideToolbar?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
  initialContent?: string; // <-- Add this prop
  ydoc: Y.Doc;
  provider?: WebsocketProvider;
  yjsUpdate?: string | Uint8Array; // base64 string or Uint8Array
  title?: string; // <-- Add this prop
  isTemplate?: boolean;
}

// Plugin to add .selectedCell class to the active table cell
function selectedCellPlugin() {
  return new Plugin({
    key: new PluginKey('selectedCell'),
    props: {
      decorations(state) {
        const { selection } = state;
        const decorations = [];
        // Always check the resolved position of the cursor
        const $pos = selection.$from;
        for (let d = $pos.depth; d > 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            const pos = $pos.before(d);
            decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'selectedCell' }));
            break;
          }
        }
        return DecorationSet.create(state.doc, decorations);
      }
    }
  });
}

// Helper to POST canonical Yjs update to backend
async function saveCanonicalYjsUpdate(noteId: string, ydoc: Y.Doc, isTemplate?: boolean) {
  console.log('[YJS DEBUG] saveCanonicalYjsUpdate called');
  try {
    const update = Y.encodeStateAsUpdate(ydoc);
    const base64 = btoa(String.fromCharCode(...update));
    if (isTemplate) {
      await api.patch(`/templates/${noteId}/yjs-update`, { yjsUpdate: base64 });
      console.log('[YJS DEBUG] Canonical Yjs update saved to backend for template:', noteId);
    } else {
      await api.patch(`/notes/${noteId}/yjs-update`, { yjsUpdate: base64 });
      console.log('[YJS DEBUG] Canonical Yjs update saved to backend for note:', noteId);
    }
  } catch (e) {
    console.error('[YJS ERROR] Failed to save canonical Yjs update:', e);
  }
}

// Type guards for Yjs content nodes
const isParagraph = (node: any): node is { type: string; content?: any[] } => node && typeof node === 'object' && 'type' in node && node.type === 'paragraph';
const isTextNode = (node: any): node is { type: string; text?: string } => node && typeof node === 'object' && 'type' in node && node.type === 'text';

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ noteId, readOnly = false, hideToolbar = false, onEditorReady, initialContent, ydoc, provider, yjsUpdate, title, isTemplate }) => {
  // Remove ydocRef and providerRef, use props instead
  // Remove useEffect that creates/destroys ydoc/provider
  // Use editorKey if needed for noteId changes
  const [editorKey, setEditorKey] = React.useState(0);
  const initialContentSetRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setEditorKey(prev => prev + 1);
    initialContentSetRef.current = null;
  }, [noteId, ydoc, provider]);

  const collaborativeExtensions = ydoc
    ? [
        CollaborativeFontSize,
        CollaborativeColor,
        CollaborativeTextAlign.configure({ types: ['heading', 'paragraph'] }),
        CollaborativeHighlight.configure({ multicolor: true }),
        CollaborativeTableCellColor,
        CollaborativeTableHeaderColor,
        Collaboration.configure({ document: ydoc }),
        provider ? CollaborationCursor.configure({ provider, user: { name: "User", color: "#ffa500" } }) : null,
      ]
    : [];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell, // Always include base TableCell
      TableHeader, // Always include base TableHeader
      Image,
      ...collaborativeExtensions,
      tableEditing(),
      selectedCellPlugin(),
    ].filter(Boolean) as any,
    content: undefined,
    editable: !readOnly,
    autofocus: true,
  }, [editorKey, readOnly, ydoc, provider]);

  // Apply canonical Yjs update if present
  React.useEffect(() => {
    if (!ydoc || !yjsUpdate) return;
    let update: Uint8Array;
    if (typeof yjsUpdate === 'string') {
      update = Uint8Array.from(atob(yjsUpdate), c => c.charCodeAt(0));
    } else {
      update = yjsUpdate;
    }
    Y.applyUpdate(ydoc, update);
    console.log('[YJS DEBUG] Applied canonical Yjs update for note:', noteId);
  }, [ydoc, yjsUpdate, noteId]);

  // Set initial content in Yjs if needed (after editor is ready, and only if no yjsUpdate was applied)
  React.useEffect(() => {
    if (!editor || !initialContent || !ydoc || yjsUpdate) return;
    // Only set initial content if we haven't already for this note
    if (initialContentSetRef.current === noteId) return;
    const yXml = ydoc.getXmlFragment('prosemirror');
    // Check if Yjs doc is truly empty or only contains an empty paragraph
    const yjsContent = yXml.toJSON ? yXml.toJSON() : [];
    let isEmpty = false;
    if (Array.isArray(yjsContent) && yjsContent.length === 1 && isParagraph(yjsContent[0])) {
      const para = yjsContent[0] as { type: string; content?: any[] };
      if (!('content' in para) || !Array.isArray(para.content) || para.content.length === 0) {
        isEmpty = true;
      } else if (
        Array.isArray(para.content) &&
        para.content.length === 1 &&
        isTextNode(para.content[0]) &&
        (!para.content[0].text || para.content[0].text.trim() === '')
      ) {
        isEmpty = true;
      }
    } else if (Array.isArray(yjsContent) && yjsContent.length === 0) {
      isEmpty = true;
    }
    if (isEmpty) {
      editor.commands.setContent(initialContent, false); // false = don't emit transaction (Yjs will sync)
      initialContentSetRef.current = noteId;
      console.log('[YJS DEBUG] Set initial content from HTML for note:', noteId);
      // --- Self-healing: Save canonical Yjs update to backend ---
      saveCanonicalYjsUpdate(noteId, ydoc, isTemplate ?? false);
    }
  }, [editor, initialContent, editorKey, noteId, ydoc, yjsUpdate, isTemplate]);

  // Reset the flag when noteId changes
  React.useEffect(() => {
    initialContentSetRef.current = null;
  }, [noteId]);

  React.useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Debounced save function
  const debouncedSave = React.useRef(
    debounce((noteId: string, ydoc: Y.Doc, isTemplate: boolean) => {
      // DEBUG: Log the actual Yjs content and paragraph node
      const yXml = ydoc.getXmlFragment('prosemirror');
      const yjsContent = yXml.toJSON ? yXml.toJSON() : [];
      console.log('[YJS DEBUG] yjsContent:', JSON.stringify(yjsContent, null, 2));
      if (Array.isArray(yjsContent) && yjsContent.length === 1 && isParagraph(yjsContent[0])) {
        console.log('[YJS DEBUG] paragraph node:', JSON.stringify(yjsContent[0], null, 2));
      }
      // Improved isEmpty logic: only treat as empty if single paragraph with no text or only whitespace
      let isEmpty = false;
      if (Array.isArray(yjsContent) && yjsContent.length === 1 && isParagraph(yjsContent[0])) {
        const para = yjsContent[0] as { type: string; content?: any[] };
        if (!('content' in para) || !Array.isArray(para.content) || para.content.length === 0) {
          isEmpty = true;
        } else if (
          Array.isArray(para.content) &&
          para.content.length === 1 &&
          isTextNode(para.content[0]) &&
          (!para.content[0].text || para.content[0].text.trim() === '')
        ) {
          isEmpty = true;
        }
      } else if (Array.isArray(yjsContent) && yjsContent.length === 0) {
        isEmpty = true;
      }
      if (!isEmpty) {
        console.log('[YJS DEBUG] Not empty, will save');
        saveCanonicalYjsUpdate(noteId, ydoc, isTemplate);
      } else {
        console.log('[YJS DEBUG] Not saving empty Yjs state for note/template:', noteId);
      }
    }, 5000)
  );

  // Save Yjs state to backend on every edit (debounced)
  React.useEffect(() => {
    if (!ydoc || !noteId) return;
    console.log('[YJS DEBUG] Setting up Yjs update listener');
    const handler = () => {
      console.log('[YJS DEBUG] Yjs update event fired');
      debouncedSave.current(noteId, ydoc, isTemplate ?? false);
    };
    ydoc.on('update', handler);
    return () => {
      ydoc.off('update', handler);
      debouncedSave.current.cancel && debouncedSave.current.cancel();
    };
  }, [ydoc, noteId, isTemplate]);

  // React.useEffect(() => {
  //   if (provider && ydoc) {
  //     const yXml = ydoc.getXmlFragment('prosemirror');
  //     // const logYjsContent = () => {
  //     //   const yjsContent = yXml.toJSON ? yXml.toJSON() : [];
  //     //   console.log('[DEBUG] Yjs XML Fragment (prosemirror):', JSON.stringify(yjsContent, null, 2));
  //     // };
  //     ydoc.on('update', logYjsContent);
  //     // Log once after connection
  //     logYjsContent();
  //     return () => {
  //       ydoc && ydoc.off('update', logYjsContent);
  //     };
  //   }
  // }, [editor, editorKey, ydoc]);

  return (
    <div>
      {!hideToolbar && <EditorToolbar editor={editor as Editor | null} />}
      {/* Title below toolbar */}
      {title && (
        <div className="px-0 pt-2 pb-2">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        </div>
      )}
      <EditorContent editor={editor} />
      {editor && <TableCellMenuOverlay editor={editor} />}
    </div>
  );
};