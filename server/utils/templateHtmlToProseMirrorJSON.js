// Utility to convert HTML to ProseMirror JSON for templates (without title requirement)
import { JSDOM } from 'jsdom';
import { Schema } from 'prosemirror-model';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

// --- Define nodes and marks for templates: content only (no title requirement) ---
const nodes = {
  doc: { content: 'block*' }, // No title requirement for templates
  paragraph: {
    group: 'block',
    content: 'inline*',
    toDOM: () => ['p', 0],
    parseDOM: [{ tag: 'p' }],
  },
  text: { group: 'inline' },
  image: {
    inline: true,
    group: 'inline',
    attrs: { src: {} },
    toDOM: node => ['img', node.attrs],
    parseDOM: [{ tag: 'img', getAttrs: dom => ({ src: dom.getAttribute('src') }) }],
  },
  bullet_list: {
    group: 'block',
    content: 'list_item+',
    toDOM: () => ['ul', 0],
    parseDOM: [{ tag: 'ul' }],
  },
  ordered_list: {
    group: 'block',
    content: 'list_item+',
    toDOM: () => ['ol', 0],
    parseDOM: [{ tag: 'ol' }],
  },
  list_item: {
    group: 'block',
    content: 'paragraph block*',
    toDOM: () => ['li', 0],
    parseDOM: [{ tag: 'li' }],
  },
  horizontal_rule: {
    group: 'block',
    toDOM: () => ['hr'],
    parseDOM: [{ tag: 'hr' }],
  },
  heading: {
    group: 'block',
    content: 'inline*',
    attrs: { level: { default: 1 } },
    toDOM: node => ['h' + node.attrs.level, 0],
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ],
  },
};

const marks = {
  bold: { toDOM: () => ['strong', 0], parseDOM: [{ tag: 'strong' }] },
  italic: { toDOM: () => ['em', 0], parseDOM: [{ tag: 'em' }] },
  underline: { toDOM: () => ['u', 0], parseDOM: [{ tag: 'u' }] },
  strike: { toDOM: () => ['s', 0], parseDOM: [{ tag: 's' }] },
  code: { toDOM: () => ['code', 0], parseDOM: [{ tag: 'code' }] },
  link: {
    attrs: { href: {} },
    toDOM: node => ['a', { href: node.attrs.href }, 0],
    parseDOM: [{ tag: 'a', getAttrs: dom => ({ href: dom.getAttribute('href') }) }],
  },
};

const schema = new Schema({ nodes, marks });

export function templateHtmlToProseMirrorJSON(html) {
  if (!html || html.trim() === '') {
    // Return empty document structure
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
    };
  }
  
  try {
    const dom = new JSDOM(`<body>${html}</body>`);
    const body = dom.window.document.body;
    const parsed = ProseMirrorDOMParser.fromSchema(schema).parse(body);
    
    // Ensure we have at least one paragraph if the document is empty
    if (parsed.content.size === 0) {
      return {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
      };
    }
    
    const json = parsed.toJSON();
    
    // Ensure all paragraph nodes have content arrays
    if (json.content && Array.isArray(json.content)) {
      json.content = json.content.map(node => {
        if (node.type === 'paragraph' && (!node.content || !Array.isArray(node.content))) {
          return {
            ...node,
            content: [{ type: 'text', text: '' }]
          };
        }
        return node;
      });
    }
    
    return json;
  } catch (error) {
    console.error('Error parsing template HTML:', error);
    // Return safe fallback
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: html }] }]
    };
  }
} 