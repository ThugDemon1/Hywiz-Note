import Color from '@tiptap/extension-color';

export const CollaborativeColor = Color.extend({
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
            style: `color: ${attributes.color}`,
          };
        },
      },
    };
  },
}); 