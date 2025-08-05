import TextAlign from '@tiptap/extension-text-align';

export const CollaborativeTextAlign = TextAlign.extend({
  addAttributes() {
    return {
      textAlign: {
        default: null,
        keepOnSplit: false,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.textAlign) {
            return {};
          }
          return {
            style: `text-align: ${attributes.textAlign}`,
          };
        },
      },
    };
  },
}); 