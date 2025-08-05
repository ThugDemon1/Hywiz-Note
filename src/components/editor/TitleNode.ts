import { Node, mergeAttributes, NodeViewRendererProps } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { NodeView } from 'prosemirror-view';

const TitleNode = Node.create({
  name: 'title',
  group: 'block',
  content: 'text*',
  defining: true,
  selectable: false,
  draggable: false,
  parseHTML() {
    return [
      {
        tag: 'h1[data-title]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'h1',
      mergeAttributes(HTMLAttributes, { 'data-title': 'true', class: 'editor-title-block', placeholder: 'Title' }),
      0,
    ];
  },
  addNodeView() {
    return ({ node, editor }: NodeViewRendererProps) => {
      const dom = document.createElement('h1');
      dom.setAttribute('data-title', 'true');
      dom.className = 'editor-title-block';
      dom.contentEditable = 'false';

      const contentDOM = document.createElement('span');
      contentDOM.className = 'editor-title-content';
      contentDOM.contentEditable = 'true';
      dom.appendChild(contentDOM);

      const placeholder = document.createElement('span');
      placeholder.className = 'editor-title-placeholder';
      placeholder.textContent = 'Title';
      dom.appendChild(placeholder);

      function updatePlaceholder() {
        if (node.textContent.length === 0) {
          placeholder.style.display = '';
        } else {
          placeholder.style.display = 'none';
        }
      }

      updatePlaceholder();

      return {
        dom,
        contentDOM,
        update(updatedNode) {
          node = updatedNode;
          updatePlaceholder();
          return true;
        },
      } as NodeView;
    };
  },
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        if (selection.$from.pos <= 2) {
          return true;
        }
        return false;
      },
      Delete: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        if (selection.$from.pos <= 2) {
          return true;
        }
        return false;
      },
      Enter: ({ editor }) => {
        const { state, commands } = editor;
        const { selection } = state;
        if (selection.$from.parent.type.name === 'title') {
          commands.insertContent('<p></p>');
          commands.focus('end');
          return true;
        }
        return false;
      },
      'Mod-ArrowUp': ({ editor }) => {
        editor.commands.focus('start');
        return true;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, newState) => {
          const firstNode = newState.doc.firstChild;
          if (!firstNode || firstNode.type.name !== 'title') {
            const tr = newState.tr;
            tr.insert(0, this.type.create());
            return tr;
          }
          if (newState.doc.childCount > 0 && newState.doc.firstChild.type.name !== 'title') {
            const tr = newState.tr;
            tr.insert(0, this.type.create());
            return tr;
          }
        },
      }),
    ];
  },
});

export default TitleNode; 