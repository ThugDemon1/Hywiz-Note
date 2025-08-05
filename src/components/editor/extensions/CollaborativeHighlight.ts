import { Highlight } from '@tiptap/extension-highlight';

export const CollaborativeHighlight = Highlight.extend({
  addAttributes() {
    return {
      color: {
        default: null,
        keepOnSplit: false,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.color) {
            return {};
          }
          return {
            style: `background-color: ${attributes.color}`,
          };
        },
      },
    };
  },
}); 