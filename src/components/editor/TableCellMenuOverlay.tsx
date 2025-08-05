import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TableCellDropdown } from './TableCellDropdown';

export function TableCellMenuOverlay({ editor }: { editor: any }) {
  const [activeCell, setActiveCell] = useState<HTMLElement | null>(null);
  const [activeCellType, setActiveCellType] = useState<'tableCell' | 'tableHeader'>('tableCell');
  const [showDropdown, setShowDropdown] = useState(false);
  const [cellRect, setCellRect] = useState<DOMRect | null>(null);
  const [buttonHovered, setButtonHovered] = useState(false);

  useEffect(() => {
    function updateActiveCell() {
      const view = editor?.view;
      if (!view) return;
      
      const { state } = view;
      const { selection } = state;
      
      if (!selection) return;
      
      const $pos = selection.$from;
      let found = false;
      
      // Simple check: are we inside a table cell?
      for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d);
        if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
          try {
            const dom = view.domAtPos($pos.start(d)).node as HTMLElement;
            if (dom && (dom.tagName === 'TD' || dom.tagName === 'TH')) {
              setActiveCell(dom);
              setActiveCellType(node.type.name === 'tableHeader' ? 'tableHeader' : 'tableCell');
              setCellRect(dom.getBoundingClientRect());
              found = true;
              break;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
      
      if (!found) {
        setActiveCell(null);
        setCellRect(null);
      }
    }

    if (!editor) return;
    const view = editor.view;
    if (!view) return;

    // Initial update
    updateActiveCell();
    
    // Simple event listeners
    const handleUpdate = () => {
      setTimeout(updateActiveCell, 0);
    };
    
    view.dom.addEventListener('click', handleUpdate);
    view.dom.addEventListener('keyup', handleUpdate);
    view.dom.addEventListener('input', handleUpdate);

    return () => {
      view.dom.removeEventListener('click', handleUpdate);
      view.dom.removeEventListener('keyup', handleUpdate);
      view.dom.removeEventListener('input', handleUpdate);
    };
  }, [editor]);

  // Close dropdown when cell changes
  useEffect(() => {
    if (!activeCell) {
      setShowDropdown(false);
    }
  }, [activeCell]);

  if (!activeCell || !cellRect) return null;

  // Button positioning
  const buttonTop = cellRect.top + window.scrollY + 2;
  const buttonLeft = cellRect.right + window.scrollX - 30;

  // Dropdown positioning with comprehensive viewport checks
  const DROPDOWN_WIDTH = 280;
  const DROPDOWN_HEIGHT = 320; // Approximate height for the new dropdown
  const BUTTON_HEIGHT = 28;
  const BUTTON_WIDTH = 28;
  
  // Calculate initial dropdown position (below button)
  let dropdownTop = buttonTop + BUTTON_HEIGHT + 4;
  let dropdownLeft = buttonLeft;
  
  // Get viewport dimensions
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // Check if dropdown would go off the bottom of the screen
  if (dropdownTop + DROPDOWN_HEIGHT > viewportHeight) {
    // Try to position above the button
    dropdownTop = buttonTop - DROPDOWN_HEIGHT - 4;
    
    // If still off screen, position at the top with some margin
    if (dropdownTop < 0) {
      dropdownTop = 8;
    }
  }
  
  // Check if dropdown would go off the right side of the screen
  if (dropdownLeft + DROPDOWN_WIDTH > viewportWidth) {
    // Try to position to the left of the button
    dropdownLeft = buttonLeft - DROPDOWN_WIDTH + BUTTON_WIDTH;
    
    // If still off screen, position at the left edge with some margin
    if (dropdownLeft < 0) {
      dropdownLeft = 8;
    }
  }
  
  // Ensure dropdown doesn't go off the left side
  if (dropdownLeft < 0) {
    dropdownLeft = 8;
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: buttonTop,
          left: buttonLeft,
          zIndex: 1001,
          background: buttonHovered ? '#146db5' : 'transparent',
          border: 'none',
          borderRadius: 6,
          padding: 4,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'background 0.18s',
        }}
        onClick={e => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
      >
        <ChevronDown size={20} />
      </div>
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: dropdownTop,
            left: dropdownLeft,
            zIndex: 1002,
          }}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <TableCellDropdown editor={editor} nodeType={activeCellType} />
        </div>
      )}
    </>
  );
} 