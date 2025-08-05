import { Editor } from '@tiptap/react';
import { Trash2, Plus, Minus, Grid3X3 } from 'lucide-react';

const COLORS = [
  '#DD5E5E', // warm red
  '#5EDD8E', // mint green
  '#5E8EDD', // soft blue
  '#DDC85E', // warm ochre
  '#8E5EDD', // purple
  '#DD5EDD', // pink-magenta
  '#5EDDDD', // aqua
  '#C3DD5E', // chartreuse
  '#DD8E5E', // terra orange
  '#5EDD5E', // bright green
  '#FFA500', // orange
  '#00AACC', // teal
  '#CC5500', // magenta
  '#008877', // lime
  '#8844CC', // cyan
  '#DD9900', // red
  '#0000FF', // blue
  '#000000', // black
];

interface TableCellDropdownProps {
  editor: Editor;
  nodeType: 'tableCell' | 'tableHeader';
}

export const TableCellDropdown: React.FC<TableCellDropdownProps> = ({ editor, nodeType }) => {
  const selectCurrentCell = () => {
    const { view } = editor;
    if (view.hasFocus()) return;
    view.focus();
  };

  const addRowAbove = () => {
    selectCurrentCell();
    // Get current table structure to determine if this should be a header
    const { state } = editor;
    const { selection } = state;
    const $pos = selection.$from;
    
    // Find the table node
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        // Check if this is the first row (index 0)
        const rowIndex = $pos.index(d);
        if (rowIndex === 0) {
          // Adding above the first row - make it a header row
          editor.chain().focus().addRowBefore().run();
          // Convert the new row to header cells
          setTimeout(() => {
            const newState = editor.state;
            const newSelection = newState.selection;
            const newPos = newSelection.$from;
            
            // Find the table again in the new state
            for (let d2 = newPos.depth; d2 > 0; d2--) {
              const tableNode = newPos.node(d2);
              if (tableNode.type.name === 'table') {
                // Get the first row (which should be the newly added row)
                const firstRow = tableNode.firstChild;
                if (firstRow) {
                  // Convert each cell in the first row to header
                  let cellPos = newPos.before(d2) + 1; // Start of first row
                  firstRow.forEach((cell, index) => {
                    if (cell.type.name === 'tableCell') {
                      // Select the cell and convert to header
                      editor.chain().focus().setNodeSelection(cellPos).run();
                      editor.chain().focus().setNode('tableHeader').run();
                    }
                    cellPos += cell.nodeSize;
                  });
                }
                break;
              }
            }
          }, 50);
        } else {
          // Adding above a non-first row - make it a body row
          editor.chain().focus().addRowBefore().run();
        }
        break;
      }
    }
  };

  const addRowBelow = () => {
    selectCurrentCell();
    // Get current table structure to determine if this should be a header
    const { state } = editor;
    const { selection } = state;
    const $pos = selection.$from;
    
    // Find the table node
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        // Check if this is the first row (index 0)
        const rowIndex = $pos.index(d);
        if (rowIndex === 0) {
          // Adding below the first row - make it a body row
          editor.chain().focus().addRowAfter().run();
        } else {
          // Adding below a non-first row - make it a body row
          editor.chain().focus().addRowAfter().run();
        }
        break;
      }
    }
  };

  const deleteRow = () => {
    selectCurrentCell();
    editor.chain().focus().deleteRow().run();
  };

  const addColumnBefore = () => {
    selectCurrentCell();
    // Get current table structure to determine if this should be a header
    const { state } = editor;
    const { selection } = state;
    const $pos = selection.$from;
    
    // Find the table node
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        // Check if this is the first column
        const table = $pos.node(d);
        const firstRow = table.firstChild;
        if (firstRow) {
          const cellIndex = $pos.index(d + 1); // Index within the row
          if (cellIndex === 0) {
            // Adding before the first column - make it a header column
            editor.chain().focus().addColumnBefore().run();
            // Convert the new column to header cells
            setTimeout(() => {
              const newState = editor.state;
              const newSelection = newState.selection;
              const newPos = newSelection.$from;
              
              // Find the table again in the new state
              for (let d2 = newPos.depth; d2 > 0; d2--) {
                const tableNode = newPos.node(d2);
                if (tableNode.type.name === 'table') {
                  // Convert first cell of each row to header
                  let rowPos = newPos.before(d2) + 1; // Start of first row
                  tableNode.forEach((row, rowIndex) => {
                    const firstCell = row.firstChild;
                    if (firstCell && firstCell.type.name === 'tableCell') {
                      // Select the first cell of this row and convert to header
                      editor.chain().focus().setNodeSelection(rowPos).run();
                      editor.chain().focus().setNode('tableHeader').run();
                    }
                    rowPos += row.nodeSize;
                  });
                }
                break;
              }
            }, 50);
          } else {
            // Adding before a non-first column - make it a body column
            editor.chain().focus().addColumnBefore().run();
          }
        }
        break;
      }
    }
  };

  const addColumnAfter = () => {
    selectCurrentCell();
    // Get current table structure to determine if this should be a header
    const { state } = editor;
    const { selection } = state;
    const $pos = selection.$from;
    
    // Find the table node
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        // Check if this is the first column
        const table = $pos.node(d);
        const firstRow = table.firstChild;
        if (firstRow) {
          const cellIndex = $pos.index(d + 1); // Index within the row
          if (cellIndex === 0) {
            // Adding after the first column - make it a body column
            editor.chain().focus().addColumnAfter().run();
          } else {
            // Adding after a non-first column - make it a body column
            editor.chain().focus().addColumnAfter().run();
          }
        }
        break;
      }
    }
  };

  const deleteColumn = () => {
    selectCurrentCell();
    editor.chain().focus().deleteColumn().run();
  };

  const deleteTable = () => {
    selectCurrentCell();
    editor.chain().focus().deleteTable().run();
  };

  return (
    <div
      style={{ 
        minWidth: '200px',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Table Operations Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ 
          color: '#fff', 
          fontSize: '13px', 
          fontWeight: '600',
          marginBottom: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Grid3X3 size={14} />
          Table Operations
        </div>
        
        {/* Row Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ color: '#ccc', fontSize: '11px', fontWeight: '500' }}>Rows</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={addRowAbove}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Plus size={12} />
              Add Above
            </button>
            <button
              onClick={addRowBelow}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Plus size={12} />
              Add Below
            </button>
            <button
              onClick={deleteRow}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#ff6b6b',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Minus size={12} />
              Delete
            </button>
          </div>
        </div>

        {/* Column Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ color: '#ccc', fontSize: '11px', fontWeight: '500' }}>Columns</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={addColumnBefore}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Plus size={12} />
              Add Left
            </button>
            <button
              onClick={addColumnAfter}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#fff',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Plus size={12} />
              Add Right
            </button>
            <button
              onClick={deleteColumn}
              style={{
                background: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                padding: '5px 8px',
                color: '#ff6b6b',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
            >
              <Minus size={12} />
              Delete
            </button>
          </div>
        </div>

        {/* Delete Table */}
        <div style={{ 
          borderTop: '1px solid #333', 
          paddingTop: '10px',
          marginTop: '6px'
        }}>
          <button
            onClick={deleteTable}
            style={{
              background: '#2a2a2a',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#ff6b6b',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s',
              width: '100%',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2a2a2a'}
          >
            <Trash2 size={14} />
            Delete Table
          </button>
        </div>
      </div>

      {/* Color Palette Section */}
      <div style={{ 
        borderTop: '1px solid #333', 
        paddingTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ 
          color: '#fff', 
          fontSize: '13px', 
          fontWeight: '600',
          marginBottom: '3px'
        }}>
          Cell Background
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: '5px',
          padding: '6px 0'
        }}>
        {COLORS.map(color => (
            <div
            key={color}
              style={{ 
                backgroundColor: color,
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: '2px solid #666',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              selectCurrentCell();
              editor.chain().focus().updateAttributes(nodeType, { backgroundColor: color }).run();
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ))}
        </div>
      </div>
    </div>
  );
}; 