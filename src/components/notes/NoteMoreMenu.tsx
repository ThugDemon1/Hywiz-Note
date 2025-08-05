import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  ExternalLink,
  Share2,
  Link as LinkIcon,
  FileText,
  Copy,
  CopyPlus,
  Tag,
  Save,
  Star,
  BookMarked,
  Home,
  ArrowLeftRight,
  Command,
  ChevronsRight,
  Search,
  Info,
  Clock,
  Printer,
  Trash2,
} from 'lucide-react';
import { copyToClipboard, generateShareLink } from '../../lib/utils';
import { useToastStore } from '../../stores/useToastStore';
import { useNotesStore } from '../../stores/useNotesStore';

const menu = [
  { icon: <ExternalLink size={18} />, label: 'Open in Lite editor' },
  { icon: <Share2 size={18} />, label: 'Share', action: 'share' },
  { icon: <LinkIcon size={18} color='white' />, label: 'Copy link' },
  'divider',
  { icon: <ArrowLeftRight size={18} />, label: 'Move', action: 'move' },
  { icon: <Copy size={18} />, label: 'Copy to' },
  { icon: <CopyPlus size={18} />, label: 'Duplicate' },
  'divider',
  { icon: <Tag size={18} />, label: 'Edit tags' },
  { icon: <Save size={18} />, label: 'Save as Template' },
  'divider',
  { icon: <Star size={18} />, label: 'Add to Shortcuts' },
  { icon: <BookMarked size={18} />, label: 'Pin to Notebook' },
  { icon: <Home size={18} />, label: 'Pin to Home' },
  'divider',
  { icon: <FileText size={18} />, label: 'Note width' },
  { icon: <Command size={18} />, label: 'Slash commands' },
  { icon: <ChevronsRight size={18} />, label: 'Collapsible sections' },
  'divider',
  { icon: <Search size={18} />, label: 'Find in note' },
  { icon: <Info size={18} />, label: 'Note info' },

  'divider',
  { icon: <Printer size={18} />, label: 'Print' },
  { icon: <Trash2 size={18} />, label: 'Move to Trash' },
];

interface NoteMoreMenuProps {
  noteId: string;
  noteTitle?: string;
  setShareDropdownOpen: (open: boolean) => void;
  setMoveModalOpen: (open: boolean) => void;
}

export const NoteMoreMenu: React.FC<NoteMoreMenuProps> = ({ noteId, noteTitle, setShareDropdownOpen, setMoveModalOpen }) => {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuItemRef = useRef<HTMLDivElement>(null);
  const showToast = useToastStore.getState().showToast;
  const duplicateNote = useNotesStore(state => state.duplicateNote);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const handleMenuClick = (item: any, index: number) => {
    if (index === 0) {
      // Open in Lite editor
      window.open(`/lite-editor/${noteId}`, '_blank');
    } else if (item.action === 'share') {
      setShareDropdownOpen(true);
    } else if (item.label === 'Copy link') {
      copyToClipboard(generateShareLink(noteId)).then(success => {
        if (success) {
          showToast('Link copied to clipboard!', 'success');
        } else {
          showToast('Failed to copy link', 'error');
        }
      });
    } else if (item.action === 'move') {
      setMoveModalOpen(true);
    } else if (item.label === 'Duplicate') {
      handleDuplicate();
    }
    setOpen(false);
    setSubmenuOpen(false);
  };

  const handleDuplicate = async () => {
    try {
      await duplicateNote(noteId);
      showToast('Note duplicated successfully!', 'success');
    } catch (error) {
      console.error('Failed to duplicate note:', error);
      showToast('Failed to duplicate note', 'error');
    }
  };

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          ref={btnRef}
          aria-label="More options"
          onClick={() => setOpen((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <MoreHorizontal />
        </button>
        {open && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              minWidth: 260,
              background: '#181818',
              color: '#fff',
              borderRadius: 10,
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.35)',
              padding: 0,
              zIndex: 1000,
              border: '1px solid #232323',
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {menu.map((item, i) =>
              typeof item === 'string' ? (
                <div key={i} style={{ borderTop: '1px solid #232323', margin: '6px 0' }} />
              ) : (
                <div
                  key={item.label}
                  ref={item.action === 'share' ? shareMenuItemRef : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    fontSize: 15,
                    position: 'relative',
                  }}
                  onClick={() => handleMenuClick(item, i)}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NoteMoreMenu; 