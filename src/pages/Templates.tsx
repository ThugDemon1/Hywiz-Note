import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { TemplateEditor } from '../components/editor/TemplateEditor';
import { useTemplatesStore } from '../stores/useTemplatesStore';

const Templates: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  // Pixel-based resizing state
  const [templatesListWidth, setTemplatesListWidth] = useState(350); // default in px
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [templatesListCollapsed, setTemplatesListCollapsed] = useState(false);

  const {
    templates,
    loading,
    error,
    fetchTemplates,
    setFilters,
    clearError
  } = useTemplatesStore();

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates based on search only (ownership is handled by backend)
  const filteredTemplates = templates.filter((template) =>
    template.title.toLowerCase().includes(search.toLowerCase()) ||
    template.description.toLowerCase().includes(search.toLowerCase()) ||
    template.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId) || filteredTemplates[0];

  // Update search filter
  useEffect(() => {
    setFilters({ search });
  }, [search, setFilters]);

  // Drag logic for resizing
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      e.preventDefault();
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;
      newWidth = Math.max(180, Math.min(containerRect.width - 180, newWidth));
      setTemplatesListWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleCloseEditor = () => {
    setSelectedTemplateId(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  return (
    <div className="h-screen flex flex-col bg-[#202124] min-h-0">
      <div
        className="flex-1 flex flex-col lg:flex-row min-h-0 h-full"
        ref={containerRef}
      >
        {/* Templates List Panel */}
        {!templatesListCollapsed && (
          <div
            className="flex flex-col bg-[#202124] transition-all duration-75 lg:flex border-r border-gray-800 z-20"
            style={{
              width: templatesListWidth,
              minWidth: 180,
              maxWidth: '80vw',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#23272B] z-10" style={{ position: 'relative' }}>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Templates
              </h2>
              <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <div className="relative" style={{ width: '100%', minWidth: 0 }}>
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search templates"
                    title=""
                    className="pl-8 pr-2 py-1.5 rounded bg-[#232323] text-white border border-[#333] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      width: '100%',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="px-4 py-2 bg-red-600 text-white text-sm">
                {error}
                <button 
                  onClick={clearError}
                  className="ml-2 underline"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {/* Templates List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-gray-400">Loading templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-6 text-gray-400">
                  {search ? 'No templates found matching your search.' : 'No templates available.'}
                </div>
              ) : (
                <ul className="divide-y divide-[#23272B]">
                  {filteredTemplates.map((template) => (
                    <li
                      key={template._id}
                      className={`bg-[#23272B] border border-[#23272B] rounded-[8px] px-4 py-3 mb-2 shadow-none transition-colors cursor-pointer ${selectedTemplateId === template._id ? 'bg-[#353A40]' : ''} border-b border-white/10`}
                      style={{ height: 115, position: 'relative' }}
                      onClick={() => handleTemplateSelect(template._id)}
                    >
                      <div className="flex items-center gap-3 h-full">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-sm font-semibold bg-[#6366f1]">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="text-[16px] font-bold text-white truncate">{template.title}</div>
                            <div className="text-[12px] text-[#A3A7AB] truncate">{template.description}</div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="flex-1 text-left truncate text-[13px] text-[#A3A7AB]">{template.category}</span>
                            <span className="flex-shrink-0 text-right text-[13px] text-[#A3A7AB]">{template.isPublic ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {/* Draggable Divider - Always visible on large screens */}
        {!templatesListCollapsed && (
          <div
            className="hidden lg:block relative"
            style={{
              width: 12,
              minWidth: 12,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 10,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              dragging.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            onDoubleClick={() => setTemplatesListWidth(350)}
          >
            {/* Visual indicator: always visible */}
            <div
              className="absolute inset-y-0 left-1/2 transform -translate-x-1/2"
              style={{
                width: 2,
                background: '#fff',
                borderRadius: 1,
                height: '100%',
                opacity: 0.7,
              }}
            />
            {/* Larger hit area for easier clicking */}
            <div
              className="absolute inset-0"
              style={{ cursor: 'col-resize' }}
            />
          </div>
        )}
        
        {/* Template Preview Panel using TemplateEditor */}
        {selectedTemplate ? (
          <div className="flex-1 bg-[#202124]">
            <TemplateEditor
              key={selectedTemplate._id} // Force remount when template changes
              templateId={selectedTemplate._id}
              onClose={handleCloseEditor}
              templatesListCollapsed={templatesListCollapsed}
              setTemplatesListCollapsed={setTemplatesListCollapsed}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center bg-[#202124]">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a template to view</h3>
              <p className="text-gray-500">Choose a template from the list to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates; 