import TextStyle from '@tiptap/extension-text-style';
import { CommandProps, RawCommands } from '@tiptap/core';

export const CollaborativeFontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        keepOnSplit: false,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: CommandProps) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: CommandProps) => {
        return chain().setMark('textStyle', { fontSize: null }).run();
      },
    } as Partial<RawCommands>;
  },
}); 