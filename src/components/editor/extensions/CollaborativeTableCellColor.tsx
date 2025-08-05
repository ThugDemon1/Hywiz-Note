import TableCell from '@tiptap/extension-table-cell';

export const CollaborativeTableCellColor = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
        parseHTML: element => element.style.backgroundColor || null,
      },
    };
  },
}); 