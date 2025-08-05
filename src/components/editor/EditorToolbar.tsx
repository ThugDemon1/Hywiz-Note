import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Undo,
  Redo,
  Quote,
  Minus,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Link,
  Image,
  Table,
  CheckSquare,
  X,
  Calendar,
  ChevronDown,
  Plus,
  Paintbrush,
  Underline,
  List,
  ListOrdered,
  Palette,
} from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { useNotesStore } from '../../stores/useNotesStore';
import { copyToClipboard, generateShareLink, showToast } from '../../lib/utils';
import { useAuthStore } from '../../stores/useAuthStore';
import ringPng from '../../assets/download.png';

interface EditorToolbarProps {
  editor: Editor | null;
  noteId?: string;
  note?: {
    title: string;
  };
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, noteId, note }) => {
  // All hooks at the top
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fetchNotes } = useNotesStore();
  const [activeDropdown, setActiveDropdown] = useState<any>(null);
  const [highlightHovered] = useState(false);
  const [moreHovered] = useState(false);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const [highlightTimeout] = useState<NodeJS.Timeout | null>(null);
  const highlightDropdownRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isOutsideAllDropdowns = !target.closest('.dropdown-container');
      if (isOutsideAllDropdowns) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (activeDropdown === 'more' || activeDropdown === 'highlight') {
      if (!moreHovered && !highlightHovered) {
        setActiveDropdown(null);
      }
    }
  }, [moreHovered, highlightHovered]);
  useEffect(() => {
    if (activeDropdown === 'more' && highlightHovered) {
      setActiveDropdown('highlight');
    }
    if (activeDropdown === 'highlight' && !highlightHovered) {
      const timeout = setTimeout(() => {
        setActiveDropdown('more');
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [highlightHovered]);
  useEffect(() => {
    return () => {
      if (highlightTimeout !== null) {
        clearTimeout(highlightTimeout);
      }
    };
  }, [highlightTimeout]);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Only after all hooks, check for editor
  if (!editor) {
    return <div className="editor-toolbar" />;
  }

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      appendParagraphIfNeeded(editor);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open modal and fetch notes if needed
  const openLinkModal = async () => {
    await fetchNotes();
    // Note: This function is called but the modal functionality is not implemented
    // The link modal functionality would be implemented here
  };

  // Helper to append a paragraph at the end if the last node is not a paragraph
  const appendParagraphIfNeeded = (editor: Editor) => {
    const { doc } = editor.state;
    const lastNode = doc.lastChild;
    if (!lastNode || lastNode.type.name !== 'paragraph' || lastNode.content.size !== 0) {
      // Insert an empty paragraph at the end
      editor.commands.insertContentAt(doc.content.size, { type: 'paragraph' });
    }
  };

  return (
    <div className="editor-toolbar flex items-center justify-start gap-1 p-3 bg-[#181818] border-b border-[#232323] relative">
      {/* Main Toolbar Bar */}
      <div className="flex items-center gap-1 px-1 py-1">
        {/* Insert Button with Dropdown */}
        <div className="relative dropdown-container">
          <button
            type="button"
            className="flex items-center gap-1 px-1 py-1 rounded-full bg-[#181818] hover:bg-[#343434] focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minWidth: 0 }}
            onClick={() => toggleDropdown('insert')}
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#818cf8]">
              <Plus className="w-3 h-3 text-white" />
            </span>
            <span className="text-white font-semibold text-sm" style={{ lineHeight: 1 }}>Insert</span>
            <ChevronDown className="w-3 h-3 text-white" />
          </button>
          {activeDropdown === 'insert' && (
            <div
              className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[180px] flex flex-col gap-1"
              onMouseEnter={() => setActiveDropdown('insert')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  appendParagraphIfNeeded(editor);
                  closeDropdown();
                }}
              >
                <Table className="w-5 h-5" />
                Insert Table
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
                onClick={() => {
                  fileInputRef.current?.click();
                  closeDropdown();
                }}
              >
                <Image className="w-5 h-5" />
                Insert Image
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
                onClick={() => {
                  openLinkModal();
                  closeDropdown();
                }}
              >
                <Link className="w-5 h-5 text-white" />
                Insert Note Link
              </button>

            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-1" />
        {/* Font Size Dropdown */}
        <div className="relative inline-block dropdown-container ml-1">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
            onClick={() => toggleDropdown('fontSize')}
          >
            <span className="text-white font-medium">
              {editor.getAttributes('textStyle').fontSize
                ? editor.getAttributes('textStyle').fontSize.replace('px', '')
                : 'Font Size'}
            </span>
            <ChevronDown className="w-4 h-4 text-white" />
          </button>
          {activeDropdown === 'fontSize' && (
            <div
              className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[120px] flex flex-col gap-1"
              onMouseEnter={() => setActiveDropdown('fontSize')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {[12, 14, 16, 18, 24, 32].map(size => (
                <button
                  key={size}
                  className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left ${editor.getAttributes('textStyle').fontSize === `${size}px` ? 'text-[#818cf8]' : ''}`}
                  onClick={() => {
                    (editor.chain().focus() as any).setFontSize(`${size}px`).run();
                    setActiveDropdown(null);
                  }}
                >
                  {size}
                </button>
              ))}
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left ${!editor.getAttributes('textStyle').fontSize ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  (editor.chain().focus() as any).unsetFontSize().run();
                  setActiveDropdown(null);
                }}
              >
                Default
              </button>
            </div>
          )}
        </div>
        {/* Text Color Palette */}
        <div className="relative inline-block dropdown-container ml-1">
          <button
            ref={colorBtnRef}
            type="button"
            onClick={() => toggleDropdown('color')}
            className="flex items-center justify-center w-6 h-6 p-0 border-none bg-transparent focus:outline-none"
            style={{ background: 'none' }}
            title="Text Color"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--editor-formatting-button-color)' }}>
                  <defs>
                    <pattern id="pattern0_12129_209028" width="1" height="1" patternContentUnits="objectBoundingBox">
                      <use xlinkHref="#image0_12129_209028" transform="scale(.01667)" />
                    </pattern>
                    <image xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAq3SURBVHgB3VtNbFxXFf7O/NgzEycZCyIlapEnLRUlqpRxN2SFx0hI6YY6CyR2TCqxgAWOKyFRFtjuogsEsiOEigRSzK67pDvURT3ZgGBROwiKKFCPRUUhlbCdxJkZe+YdvnPvfTNjEgf8l8xwrOP75v1/9/zcc8+5T3BENKHIt4BSGihkkTifgRYHgXwWyt8C/iYLskB1gJwD1rnvFttKBlgeF6zjCEhwiFQgyDwwyRcuEUiJAJH1oAgODmQMNgfRQahk/TnK45Jx28CgP15h+zb33fi8oIpDokMBfFoNnEwT4Fj84v7lnRSVIMRvwwHldhuc7xAN5wu6rx3saELlGHT2lKCCA1ICB6AUgQ6pLG4Di01KNCIwqjFafMmI3CI47uM22Pq+VZ6j4Xpxf+r+J+B7P9lm0SSP2XaKHcmj795RWWkoJnAA2h9gzRSokIsEZEDHDCRbbTqwHlzLAVUJAB1IdfAc5vDHE3wbg1XfxkBFybYtBA36gxH+vq6NxDVdQwH7oL2rtJ6ZBBozgsZJtpIktMG2bUK9varQ+TiHlEOCTii6xWOVE84xYX2+yyG9qSgM0fx5fjHrWMa4XehW7ayzdzMLaKrFPqnDHl1FTWflaSzgSEiLeehzc6IjFNtpcp4CzLBNuP95ZVewPatYO6eYuaD7k4DREq99XzH5oWLl77zvmkpU470jPlFr5HXyP8irEukHmMOhk5byosUl0XN87LPkpyPRU3z8cW4PaJL/zZY/TZvGIdNtRfkegW8TtG4R5B1Rvc32b2z/Qv49978nS/rr/62D/7tK68UCsLlIFWa7xR0Nx+r1ijeoV7k9RXd1A0dIzSbKyQamUZcC6nQD9vg6X59eDFtir7PKbhiX8UcPYY92WjpRoJsh2DSHWIYH5LgV315VpEePGqxRKkVb3cI4tvQX2CZAA7lFsG6bdr1NCd+XRb2O/KPu80jABHqdo2GBwFQc2LTtcy33U6ofX4GsH0lE9ND3GUZVzqBMCb/qlM1Am5K5Vk3hCnRmjwS9O2At0xmkzwssXhqUIFXeNUOASUr1T/N4QiTPYx739EWC3HAWVqc8GuKtbUuL+FdietdrH7pXv1UWNK9RX2Cs/k7GBFsbZ+CzjB4gfQdFvtoiJZz37kX9K2+JAZ+SKTwglAcB63cLvJJ226Td2l3cHUxvlL9fhNzoCbAxUX2LtN0lZ8/udane7pUp/Qij8tpOJ/YQlU5PU41H4CNZU+E43H+118AaySUsU6WnvMeW4L1h23ncx7UHzu/+kdQ3JiJEdFQWJHp1pqTJjYVIfnIZPUw6xwBkWyaDx/av3yK8FoeqH3YmHTskHCE75yVrjqo9Z6lGSM+i12kDsww1V72kgbYTq8sOB9YGnNKflfwQ5KNYTtrUq3R2FjJfRY+TzDA+38SUc1x18X7Wx0YlLXciwDbgJganPcBYujYUZauQ7y+gT0h+gBuoUX3rFgAiHptNvdtS9oD1OiOqAZOwaGcKTq88+Dr6jepUbS/ZDtdlTCd8MBIknJzQ4I3j/ANDyFXINxfQZyQ/p4QbVO8afKztwNM6m4krdjwAzrwcZ5ziYSiB408skjow1fSqA1kLcxwDXtMxO2Rzg7wgtYY4R2GJGddGZyEvVdGHpBcZUzdlBSG/hKb6XEpahxMp5IsIAQacZ3YqXe1XsEbyS0ZX98mm1iZlH5Ao7qKUijBAUadEfXeI7xKtoN+ppjcp1REPhxypKW4hEWGwS8J+/GUytedCyD1TPbEUhidph5tbOJ8S5E7SbsXbbZxA1Vvod6pFN53darBfxygytTxw1iVP22zxdVRFv1OdQ1PkwHrELgGMkyJ6T2PJuj6wM+TEoZZgngRpnoFGC2v+R5C05cBFm160qu6XB5zue8BGmmoXOcIOZXK/mfTQ20L+P6JWMt7yGO2f3FVV7dptFGEYw/LYknNHRSrHI1+6CsBMwtpgJpDjUyj6xL7LAu2+Bqw4XXBxhdPdyBe2RKopqdOwFSNWAXOm7ct8efQ9ZQpBet5jOYXWakLv43es14jYwGythWObh18yefw0dB4uiPJVaKib528kGH0sS6d6ournkufR75RgBKk58WAzVGdGkzqwnErWUTUNV06SJMwuaOMlRZ+THiu58rz6WaBnVASLHKJTWBPdAVpZ3X4GL7EG24ekmChANj/0zqrlvbQDnhpOYJzDTwMVqrK3Y7LZNKdXZfQvvezU2VTZL5Oh08pQupV1n/EgYDH7jTN9dFy062+jX0lyV5zNSnv9kIF3FU4PeAtXtdE1jfLAh/GmltBnpPhGGZoteOka6HjqO/S2HfeAL3m1jgEH1VbpSm/2D+WmHUDnlU2yTDfrANX5raod7VQeakxvdlKbGibOJbyhB1om9DhJ8b0ygY6EJW50VoNh1dhQu3Kyc7LwY1b7WxhTFgvFFlv5EtOqJjCKmd6OrRVz9Mz3F2mfBb60+sKSAWhWRa+ejc/bWT30SWwRv5TDpUfovQsMPvtAtTN8x2MjVGmvyla8t+hKU1PdZ+0E/B2pULqWyIZFXNqx5yt4Ra+gR0nx1iQ9ctkPQbnAWXNaC4If7Vh/8mB9OMJl2ITCg41DTQM9h69qET1GineKBDvvJWsgs2HszVXxkKrng4BnpEqQrwe1dqBj8AxGFvHl3gGt+C3B5t51YBHW/tmEQbKmzrOC16r/ec3uGY5XdI7D0qSriZuKb7lgxMqQG4zSxvEreaKpXMUHBLtNJ1U72Sn7s6bioqftecHXph523e6reCLMUtK3XMbewMaOrIG8bGIJn3tyNq3YoM0OvUcp5kMUFbMNQ8u7gTXaHfACh6FtWwjGYckkHBbyqAdunTCXOK3XkNcCHhNRT/MtW9wgA/MOqA8dfU1b3HL0KmPoSzgQXdSCfFFX5AsaySj5HNObz5KfIn+K+ZGcriSTrLEfMf0zqRP3oCsNYVJGWnz4JvkT8kcsovyZ7R9WFEsFHApdoBRHdUle4H0/S5CfYXuK7XGmTgZUU3Tmx0VXTuHwgf8RWmLksPgxn8E5bLTJdtsyUbLNh9/hi9xmu7qkWDmCtNRzdGQjfMYZPiPPNsPnJpSWo5rny5xh7z9D4C8kdPIC9q/qi7z2N9DpJeja+7z3X3nfj3j/T9hukOvcpmqrrWlQrM3vBeze89BPaZl5r2na8YjZdbrlrEc7CyW8ZXE0VLdAXHGT++1rleUh/v4pOkmFOdokjznOJjCWBoqZCCVapy0Q19gyAytjJ3FLWsXNcNeTiGaTSO6pcL+/xLs5qjpmEg183a2+lDDrDCmzELq7bFKIfVwn5LQTC4XJG8IU3YHJ+vuoTde7gPqVnhqA8njad+LlLPaekdnfNw/rfFBdysycXKJUqla7cB9m8IUSlKxr1d1cjN1HD+F7Bunu4vDdR6ThAwj3vYRfi9AKlWq3raFlTorbXxqGjO8H7P4BB6I237gLOUvQ4yxDVngzTXqQDrgD7YE78AbK1zv89Rq++LCesEKfAScg8fVrB5pOwnVChWDHCyrjZyAVHIAOtZb0PJ0N1XWCqveV+EOtHDo5B6fuEj4E6VJbN02HU1tno2b/prbcvnkCmB/F4U1Nj6x4VvIOqZijM6IjKhJ4ftA+yzOHpN4urRMIsmpfuvDYsn2ClwJWqSWVSzia+fe/AfG2GLym94NzAAAAAElFTkSuQmCC" id="image0_12129_209028" width="60" height="60" preserveAspectRatio="none" />
                    </defs>
                    <path fill="url(#pattern0_12129_209028)" d="M2 2h20v20H2z"></path>
                    <circle cx="12" cy="12" r="6.5" fill={editor.getAttributes('textStyle').color || '#fff'} stroke="#232323" strokeWidth="1" />
                  </svg>
                </span>
                <ChevronDown color="#fff" size={12} className="ml-1" />
              </span>
            </button>
            {activeDropdown === 'color' && (
              <div
                ref={colorDropdownRef}
                className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-3 rounded shadow-xl"
                style={{ minWidth: 220 }}
                onMouseEnter={() => setActiveDropdown('color')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {/* Auto button */}
                <button
                  onClick={() => {
                    editor.chain().focus().setColor('').run();
                    closeDropdown();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded border border-[#666] mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: 'rgba(30,30,30,0.9)' }}
                >
                  <span className="w-6 h-6 rounded-full border border-[#888] flex items-center justify-center bg-gradient-to-br from-[#fff] to-[#eee] relative">
                    <span style={{ position: 'absolute', width: '100%', height: 2, background: '#888', transform: 'rotate(-45deg)', top: '50%', left: 0, marginTop: -1 }} />
                  </span>
                  <span>Auto</span>
                </button>
                {/* Color swatches grid */}
                <div className="grid grid-cols-7 gap-2">
                  {[
                    '#d3d3d3', '#a0a0a0', '#666', '#222', '#000', '#b96fff', '#e255ff',
                    '#ff4b4b', '#ff914d', '#ffe14d', '#5ffb8c', '#4ddfff', '#4d7fff', '#3a5fff'
                  ].map((color, idx) => (
                    <button
                      key={color + idx}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        closeDropdown();
                      }}
                      className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-1" />
        {/* Block style dropdown (Aa) */}
        <div className="relative inline-block dropdown-container">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
            onClick={() => toggleDropdown('block')}
          >
            <span className="text-xl font-bold">Aa</span>
            <span className="text-white font-medium">
              {editor.isActive('heading', { level: 1 }) ? 'Large header' :
                editor.isActive('heading', { level: 2 }) ? 'Medium header' :
                  editor.isActive('heading', { level: 3 }) ? 'Small header' :
                    'Normal text'}
            </span>
            <ChevronDown className="w-4 h-4 text-white" />
          </button>
          {activeDropdown === 'block' && (
            <div
              className="absolute left-0 top-full z-50 mt-2 bg-[#181818] text-white p-2 rounded shadow-xl min-w-[220px] flex flex-col gap-1"
              onMouseEnter={() => setActiveDropdown('block')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${!editor.isActive('heading', { level: 1 }) && !editor.isActive('heading', { level: 2 }) && !editor.isActive('heading', { level: 3 }) ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  closeDropdown();
                }}
              >
                <span className="text-xl font-bold">Aa</span> Normal text
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 1 }) ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  closeDropdown();
                }}
              >
                <span className="text-lg font-bold">H1</span> Large header
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 2 }) ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  closeDropdown();
                }}
              >
                <span className="text-lg font-bold">H2</span> Medium header
              </button>
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 3 }) ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  closeDropdown();
                }}
              >
                <span className="text-lg font-bold">H3</span> Small header
              </button>
            </div>
          )}
        </div>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-1" />
        {/* Inline style buttons */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-2" />
        {/* Task List */}
        <button onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare className="w-4 h-4" />
        </button>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-2" />
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="w-4 h-4" />
          </button>
        </div>
        {/* Divider */}
        <div className="w-px h-6 bg-[#444] mx-2" />
        {/* More button with dropdown */}
        <div className="relative inline-block ml-2 dropdown-container">
          <button
            ref={moreBtnRef}
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
            onClick={() => toggleDropdown('more')}
          >
            <span className="text-white font-semibold text-sm">More</span>
            <ChevronDown className="w-3 h-3 text-white" />
          </button>
          {(activeDropdown === 'more' || activeDropdown === 'highlight') && (
            <div
              className="absolute top-full z-50 mt-2"
              style={{
                left: 0,
                right: 0,
                minWidth: '180px'
              }}
              onMouseEnter={() => {
                if (activeDropdown === 'more') {
                  setActiveDropdown('more');
                }
              }}
              onMouseLeave={() => {
                setActiveDropdown(null);
              }}
            >
              <div
                ref={moreDropdownRef}
                className="absolute left-0 top-0 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[180px] flex flex-col gap-1"
                style={{ 
                  zIndex: 50,
                  maxWidth: '200px',
                  transform: moreBtnRef.current ? (() => {
                    const rect = moreBtnRef.current!.getBoundingClientRect();
                    const dropdownWidth = 200;
                    const viewportWidth = window.innerWidth;
                    
                    // If dropdown would overflow right edge, align to right
                    if (rect.left + dropdownWidth > viewportWidth) {
                      return `translateX(${Math.max(0, viewportWidth - dropdownWidth - rect.left - 10)}px)`;
                    }
                    // Otherwise, align to button
                    return 'translateX(0)';
                  })() : 'translateX(0)'
                }}
              >
                {/* Brush (highlight) button at top, with palette opening to the left */}
                <div className="relative" style={{ minHeight: 40 }}>
                  <button
                    ref={highlightBtnRef}
                    type="button"
                    className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full ${activeDropdown === 'highlight' ? 'bg-[#353A40]' : ''}`}
                    style={{ background: activeDropdown === 'highlight' ? '#353A40' : 'none', position: 'relative', zIndex: 52 }}
                    title="Highlight Color"
                    onMouseEnter={() => setActiveDropdown('highlight')}
                    onMouseLeave={e => {
                      // If moving to the highlight dropdown, don't close
                      const related = e.relatedTarget as HTMLElement | null;
                      if (!related || !related.closest('[data-highlight-dropdown]')) {
                        setActiveDropdown('more');
                      }
                    }}
                  >
                    <Paintbrush className="w-5 h-5 text-white" />
                    Highlight
                    <ChevronDown color="#fff" size={16} className="ml-1" />
                  </button>
                  {/* Buffer zone between highlight button and dropdown (to the left) */}
                  {activeDropdown === 'highlight' && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '100%',
                        top: 0,
                        width: 150,
                        height: '100%',
                        zIndex: 51,
                        pointerEvents: 'auto',
                      }}
                      onMouseEnter={() => setActiveDropdown('highlight')}
                      onMouseLeave={() => setActiveDropdown('more')}
                    />
                  )}
                  {activeDropdown === 'highlight' && (
                    <div
                      ref={highlightDropdownRef}
                      className="absolute top-0 bg-[#232323] text-white p-4 rounded shadow-xl"
                      style={{
                        minWidth: 220,
                        zIndex: 53,
                        right: '100%',
                        marginRight: '8px',
                        maxWidth: '220px',
                        left: (() => {
                          if (!moreBtnRef.current) return 'auto';
                          const rect = moreBtnRef.current.getBoundingClientRect();
                          const dropdownWidth = 220;
                          
                          // If highlight dropdown would overflow left edge, position it to the right
                          if (rect.left - dropdownWidth < 0) {
                            return '100%';
                          }
                          return 'auto';
                        })()
                      }}
                      data-highlight-dropdown="true"
                      onMouseLeave={() => setActiveDropdown('more')}
                    >
                      {/* Auto button */}
                      <button
                        onClick={() => {
                          editor.chain().focus().unsetHighlight().run();
                          setActiveDropdown('more');
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded border border-[#666] mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ background: 'rgba(30,30,30,0.9)' }}
                      >
                        <span className="w-6 h-6 rounded-full border border-[#888] flex items-center justify-center bg-gradient-to-br from-[#fff] to-[#eee] relative">
                          <span style={{ position: 'absolute', width: '100%', height: 2, background: '#888', transform: 'rotate(-45deg)', top: '50%', left: 0, marginTop: -1 }} />
                        </span>
                        <span>Auto</span>
                      </button>
                      {/* For white text */}
                      <div>
                        <div className="text-xs text-gray-300 mb-1 ml-1">For White text</div>
                        <div className="grid grid-cols-7 gap-2 mb-3">
                          {[
                            '#2E2E2E', '#191970', '#228B22', '#DC143C', '#2F4F4F', '#663399', '#008B8B',
                          ].map((color, idx) => (
                            <button
                              key={'white' + color + idx}
                              onClick={() => {
                                editor.chain().focus().setHighlight({ color }).run();
                                setActiveDropdown('more');
                              }}
                              className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        {/* For black text */}
                        <div className="text-xs text-gray-300 mb-1 ml-1">For Black text</div>
                        <div className="grid grid-cols-7 gap-2">
                          {[
                            '#FFFACD', '#FFFFE0', '#98FB98', '#E0FFFF', '#E6E6FA', '#FFE4E1', '#FFB6C1',
                          ].map((color, idx) => (
                            <button
                              key={'black' + color + idx}
                              onClick={() => {
                                editor.chain().focus().setHighlight({ color }).run();
                                setActiveDropdown('more');
                              }}
                              className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rest of the More dropdown items */}
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={editor.isActive({ textAlign: 'left' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                  title="Align Left"
                  onMouseEnter={() => setActiveDropdown('more')}
                >
                  <AlignLeft className="w-5 h-5" /> Align Left
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={editor.isActive({ textAlign: 'center' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                  title="Align Center"
                  onMouseEnter={() => setActiveDropdown('more')}
                >
                  <AlignCenter className="w-5 h-5" /> Align Center
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={editor.isActive({ textAlign: 'right' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                  title="Align Right"
                  onMouseEnter={() => setActiveDropdown('more')}
                >
                  <AlignRight className="w-5 h-5" /> Align Right
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={editor.isActive('blockquote') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                >
                  <Quote className="w-5 h-5" /> Quote
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().setHorizontalRule().run();
                    appendParagraphIfNeeded(editor);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full"
                >
                  <Minus className="w-5 h-5" /> Horizontal Rule
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  disabled={!editor.can().chain().focus().toggleCode().run()}
                  className={editor.isActive('code') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                >
                  <Code className="w-5 h-5" /> Code
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" /> Bullet List
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" /> Numbered List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TemplateEditorToolbarProps {
  editor: Editor | null;
}

export const TemplateEditorToolbar: React.FC<TemplateEditorToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<any>(null);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const highlightDropdownRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  const TEXT_COLORS = [
    '#e0e0e0', '#bdbdbd', '#757575', '#212121', '#ba68c8',
    '#f06292', '#ff8a65', '#ffd54f', '#aed581', '#4dd0e1', '#64b5f6', '#1976d2',
  ];

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  if (!editor) {
    return <div className="editor-toolbar" />;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      appendParagraphIfNeeded(editor);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const appendParagraphIfNeeded = (editor: Editor) => {
    const { doc } = editor.state;
    const lastNode = doc.lastChild;
    if (!lastNode || lastNode.type.name !== 'paragraph' || lastNode.content.size !== 0) {
      editor.commands.insertContentAt(doc.content.size, { type: 'paragraph' });
    }
  };

  return (
    <div className="editor-toolbar flex flex-wrap items-center gap-1 p-3 bg-black-100 dark:bg-black-800 border-b border-gray-300 dark:border-gray-600 relative justify-start">
      {/* Insert Button with Dropdown */}
      <div className="relative dropdown-container">
        <button
          type="button"
          className="flex items-center gap-1 px-1 py-1 rounded-full bg-[#181818] hover:bg-[#343434] focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ minWidth: 0 }}
          onClick={() => toggleDropdown('insert')}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#818cf8]">
            <Plus className="w-4 h-4 text-white" />
          </span>
          <span className="text-white font-semibold text-base" style={{ lineHeight: 1 }}>Insert</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        {activeDropdown === 'insert' && (
          <div
            className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[180px] flex flex-col gap-1"
            onMouseEnter={() => setActiveDropdown('insert')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                appendParagraphIfNeeded(editor);
                closeDropdown();
              }}
            >
              <Table className="w-5 h-5" />
              Insert Table
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
              onClick={() => {
                fileInputRef.current?.click();
                closeDropdown();
              }}
            >
              <Image className="w-5 h-5" />
              Insert Image
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left"
              onClick={closeDropdown}
            >
              <Link className="w-5 h-5 text-white" />
              Insert Note Link
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* Font Size Dropdown */}
      <div className="relative inline-block dropdown-container ml-1">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
          onClick={() => toggleDropdown('fontSize')}
        >
          <span className="text-white font-medium text-sm">
            {editor.getAttributes('textStyle').fontSize
              ? editor.getAttributes('textStyle').fontSize.replace('px', '')
              : 'Font Size'}
          </span>
          <ChevronDown className="w-3 h-3 text-white" />
        </button>
        {activeDropdown === 'fontSize' && (
          <div
            className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[120px] flex flex-col gap-1"
            onMouseEnter={() => setActiveDropdown('fontSize')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {[12, 14, 16, 18, 24, 32].map(size => (
              <button
                key={size}
                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left ${editor.getAttributes('textStyle').fontSize === `${size}px` ? 'text-[#818cf8]' : ''}`}
                onClick={() => {
                  (editor.chain().focus() as any).setFontSize(`${size}px`).run();
                  setActiveDropdown(null);
                }}
              >
                {size}
              </button>
            ))}
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left ${!editor.getAttributes('textStyle').fontSize ? 'text-[#818cf8]' : ''}`}
              onClick={() => {
                (editor.chain().focus() as any).unsetFontSize().run();
                setActiveDropdown(null);
              }}
            >
              Default
            </button>
          </div>
        )}
      </div>
      {/* Text Color Palette */}
      <div className="relative inline-block dropdown-container ml-1">
        <button
          ref={colorBtnRef}
          type="button"
          onClick={() => toggleDropdown('color')}
          className="flex items-center justify-center w-6 h-6 p-0 border-none bg-transparent focus:outline-none"
          style={{ background: 'none' }}
          title="Text Color"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--editor-formatting-button-color)' }}>
                <defs>
                  <pattern id="pattern0_12129_209028" width="1" height="1" patternContentUnits="objectBoundingBox">
                    <use xlinkHref="#image0_12129_209028" transform="scale(.01667)" />
                  </pattern>
                  <image xlinkHref="data:image/png;base64,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" id="image0_12129_209028" width="60" height="60" preserveAspectRatio="none" />
                </defs>
                <path fill="url(#pattern0_12129_209028)" d="M2 2h20v20H2z"></path>
                <circle cx="12" cy="12" r="5.833" fill={editor.getAttributes('textStyle').color || 'currentColor'}></circle>
              </svg>
            </span>
            <ChevronDown color="#fff" size={12} className="ml-1" />
          </span>
        </button>
        {activeDropdown === 'color' && (
          <div
            ref={colorDropdownRef}
            className="absolute left-0 top-full z-50 mt-2 bg-[#232323] text-white p-3 rounded shadow-xl"
            style={{ minWidth: 220 }}
            onMouseEnter={() => setActiveDropdown('color')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {/* Auto button */}
            <button
              onClick={() => {
                editor.chain().focus().setColor('').run();
                closeDropdown();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded border border-[#666] mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: 'rgba(30,30,30,0.9)' }}
            >
              <span className="w-6 h-6 rounded-full border border-[#888] flex items-center justify-center bg-gradient-to-br from-[#fff] to-[#eee] relative">
                <span style={{ position: 'absolute', width: '100%', height: 2, background: '#888', transform: 'rotate(-45deg)', top: '50%', left: 0, marginTop: -1 }} />
              </span>
              <span>Auto</span>
            </button>
            {/* Color swatches grid */}
            <div className="grid grid-cols-7 gap-2">
              {[
                '#d3d3d3', '#a0a0a0', '#666', '#222', '#000', '#b96fff', '#e255ff',
                '#ff4b4b', '#ff914d', '#ffe14d', '#5ffb8c', '#4ddfff', '#4d7fff', '#3a5fff'
              ].map((color, idx) => (
                <button
                  key={color + idx}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    closeDropdown();
                  }}
                  className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* Block style dropdown (Aa) */}
      <div className="relative inline-block dropdown-container">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
          onClick={() => toggleDropdown('block')}
        >
          <span className="text-xl font-bold">Aa</span>
          <span className="text-white font-medium">
            {editor.isActive('heading', { level: 1 }) ? 'Large header' :
              editor.isActive('heading', { level: 2 }) ? 'Medium header' :
                editor.isActive('heading', { level: 3 }) ? 'Small header' :
                  'Normal text'}
          </span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        {activeDropdown === 'block' && (
          <div
            className="absolute left-0 top-full z-50 mt-2 bg-[#181818] text-white p-2 rounded shadow-xl min-w-[220px] flex flex-col gap-1"
            onMouseEnter={() => setActiveDropdown('block')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${!editor.isActive('heading', { level: 1 }) && !editor.isActive('heading', { level: 2 }) && !editor.isActive('heading', { level: 3 }) ? 'text-[#818cf8]' : ''}`}
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                closeDropdown();
              }}
            >
              <span className="text-xl font-bold">Aa</span> Normal text
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 1 }) ? 'text-[#818cf8]' : ''}`}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                closeDropdown();
              }}
            >
              <span className="text-lg font-bold">H1</span> Large header
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 2 }) ? 'text-[#818cf8]' : ''}`}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                closeDropdown();
              }}
            >
              <span className="text-lg font-bold">H2</span> Medium header
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#232323] text-left ${editor.isActive('heading', { level: 3 }) ? 'text-[#818cf8]' : ''}`}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                closeDropdown();
              }}
            >
              <span className="text-lg font-bold">H3</span> Small header
            </button>
          </div>
        )}
      </div>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* Inline style buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        <Bold className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        <Italic className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'is-active' : ''}
      >
        <Underline className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
      >
        <Strikethrough className="w-5 h-5" />
      </button>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* Task List */}
      <button onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <CheckSquare className="w-5 h-5" />
      </button>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="w-4 h-4" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="w-4 h-4" />
        </button>
      </div>
      {/* Divider */}
      <div className="w-px h-6 bg-[#444] mx-2" />
      {/* More button with dropdown */}
      <div className="relative inline-block ml-2 dropdown-container">
        <button
          ref={moreBtnRef}
          type="button"
          className="flex items-center gap-2 px-3 py-1 rounded bg-transparent hover:bg-[#232323] focus:outline-none"
          onClick={() => toggleDropdown('more')}
        >
          <span className="text-white font-semibold text-base">More</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        {(activeDropdown === 'more' || activeDropdown === 'highlight') && (
          <div
            className="absolute top-full z-50 mt-2"
            style={{
              left: 0,
              right: 0,
              minWidth: '200px'
            }}
            onMouseEnter={() => {
              if (activeDropdown === 'more') {
                setActiveDropdown('more');
              }
            }}
            onMouseLeave={() => {
              setActiveDropdown(null);
            }}
          >
            <div
              ref={moreDropdownRef}
              className="absolute top-0 bg-[#232323] text-white p-2 rounded shadow-xl min-w-[200px] flex flex-col gap-1"
              style={{ 
                zIndex: 50, 
                maxWidth: '200px',
                transform: moreBtnRef.current ? (() => {
                  const rect = moreBtnRef.current!.getBoundingClientRect();
                  const dropdownWidth = 200;
                  const viewportWidth = window.innerWidth;
                  
                  // If dropdown would overflow right edge, align to right
                  if (rect.left + dropdownWidth > viewportWidth) {
                    return `translateX(${Math.max(0, viewportWidth - dropdownWidth - rect.left - 10)}px)`;
                  }
                  // Otherwise, align to button
                  return 'translateX(0)';
                })() : 'translateX(0)'
              }}
            >
              {/* Highlight button and palette */}
              <div className="relative" style={{ minHeight: 40 }}>
                <button
                  ref={highlightBtnRef}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full ${activeDropdown === 'highlight' ? 'bg-[#353A40]' : ''}`}
                  style={{ background: activeDropdown === 'highlight' ? '#353A40' : 'none', position: 'relative', zIndex: 52 }}
                  title="Highlight Color"
                  onMouseEnter={() => setActiveDropdown('highlight')}
                  onMouseLeave={e => {
                    const related = e.relatedTarget as HTMLElement | null;
                    if (!related || !related.closest('[data-highlight-dropdown]')) {
                      setActiveDropdown('more');
                    }
                  }}
                >
                  <Paintbrush className="w-5 h-5" />
                  Highlight
                  <ChevronDown color="#fff" size={16} className="ml-1" />
                </button>
                {/* Buffer zone between highlight button and dropdown (to the left) */}
                {activeDropdown === 'highlight' && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '100%',
                      top: 0,
                      width: 150,
                      height: '100%',
                      zIndex: 51,
                      pointerEvents: 'auto',
                    }}
                    onMouseEnter={() => setActiveDropdown('highlight')}
                    onMouseLeave={() => setActiveDropdown('more')}
                  />
                )}
                {activeDropdown === 'highlight' && (
                  <div
                    ref={highlightDropdownRef}
                    className="absolute top-0 bg-[#232323] text-white p-4 rounded shadow-xl"
                    style={{ 
                      minWidth: 220, 
                      zIndex: 53,
                      right: '100%',
                      marginRight: '8px',
                      maxWidth: '220px',
                      left: (() => {
                        if (!moreBtnRef.current) return 'auto';
                        const rect = moreBtnRef.current.getBoundingClientRect();
                        const dropdownWidth = 220;
                        const viewportWidth = window.innerWidth;
                        
                        // If highlight dropdown would overflow left edge, position it to the right
                        if (rect.left - dropdownWidth < 0) {
                          return '100%';
                        }
                        return 'auto';
                      })()
                    }}
                    data-highlight-dropdown="true"
                    onMouseLeave={() => setActiveDropdown('more')}
                  >
                    {/* Auto button */}
                    <button
                      onClick={() => {
                        editor.chain().focus().unsetHighlight().run();
                        setActiveDropdown('more');
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded border border-[#666] mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ background: 'rgba(30,30,30,0.9)' }}
                    >
                      <span className="w-6 h-6 rounded-full border border-[#888] flex items-center justify-center bg-gradient-to-br from-[#fff] to-[#eee] relative">
                        <span style={{ position: 'absolute', width: '100%', height: 2, background: '#888', transform: 'rotate(-45deg)', top: '50%', left: 0, marginTop: -1 }} />
                      </span>
                      <span>Auto</span>
                    </button>
                    {/* For white text */}
                    <div>
                      <div className="text-xs text-gray-300 mb-1 ml-1">For White text</div>
                      <div className="grid grid-cols-7 gap-2 mb-3">
                        {['#2E2E2E', '#191970', '#228B22', '#DC143C', '#2F4F4F', '#663399', '#008B8B'].map((color, idx) => (
                          <button
                            key={'white' + color + idx}
                            onClick={() => {
                              editor.chain().focus().setHighlight({ color }).run();
                              setActiveDropdown('more');
                            }}
                            className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      {/* For black text */}
                      <div className="text-xs text-gray-300 mb-1 ml-1">For Black text</div>
                      <div className="grid grid-cols-7 gap-2">
                        {['#FFFACD', '#FFFFE0', '#98FB98', '#E0FFFF', '#E6E6FA', '#FFE4E1', '#FFB6C1'].map((color, idx) => (
                          <button
                            key={'black' + color + idx}
                            onClick={() => {
                              editor.chain().focus().setHighlight({ color }).run();
                              setActiveDropdown('more');
                            }}
                            className="w-7 h-7 rounded-full border border-[#888] hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                title="Align Left"
                onMouseEnter={() => setActiveDropdown('more')}
              >
                <AlignLeft className="w-5 h-5" /> Align Left
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                title="Align Center"
                onMouseEnter={() => setActiveDropdown('more')}
              >
                <AlignCenter className="w-5 h-5" /> Align Center
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                title="Align Right"
                onMouseEnter={() => setActiveDropdown('more')}
              >
                <AlignRight className="w-5 h-5" /> Align Right
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
              >
                <Quote className="w-5 h-5" /> Quote
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run();
                  appendParagraphIfNeeded(editor);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full"
              >
                <Minus className="w-5 h-5" /> Horizontal Rule
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
              >
                <Code className="w-5 h-5" /> Code
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                title="Bullet List"
              >
                <List className="w-4 h-4" /> Bullet List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full' : 'flex items-center gap-2 px-3 py-2 rounded hover:bg-[#353A40] text-left w-full'}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" /> Numbered List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};