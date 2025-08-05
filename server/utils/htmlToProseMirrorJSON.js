// Utility to convert HTML to ProseMirror JSON using the app's schema
import { JSDOM } from 'jsdom';
import { Schema } from 'prosemirror-model';
import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';

// --- Define nodes and marks for a note: title (heading) + content (body) ---
const nodes = {
  doc: { content: 'title block*' },
  title: {
    content: 'text*',
    toDOM: () => ['h1', { 'data-title': 'true' }, 0],
    parseDOM: [{ tag: 'h1[data-title]' }],
  },
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

export function htmlToProseMirrorJSON(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  return ProseMirrorDOMParser.fromSchema(schema).parse(body).toJSON();
} 