import TableHeader from '@tiptap/extension-table-header';

export const CollaborativeTableHeaderColor = TableHeader.extend({
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