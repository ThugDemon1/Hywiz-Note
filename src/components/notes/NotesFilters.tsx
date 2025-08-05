import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Tag, Book } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useTagsStore } from '../../stores/useTagsStore';
import { useNotebooksStore } from '../../stores/useNotebooksStore';

export const NotesFilters: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { fetchNotes } = useNotesStore();
  const { tags, fetchTags } = useTagsStore();
  const { notebooks, fetchNotebooks } = useNotebooksStore();

  const [selectedNotebook, setSelectedNotebook] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // Click outside to close
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose && onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  useEffect(() => {
    fetchTags();
    fetchNotebooks();
  }, [fetchTags, fetchNotebooks]);

  // Fetch notes when filters change
  useEffect(() => {
    const filters: any = {};
    if (selectedNotebook) filters.notebook = selectedNotebook;
    if (selectedTags.length > 0) filters.tags = { $all: selectedTags.join(',') };
    if (createdFrom) filters.createdFrom = createdFrom;
    if (createdTo) filters.createdTo = createdTo;
    fetchNotes(filters);
  }, [selectedNotebook, selectedTags, createdFrom, createdTo, fetchNotes]);

  const handleClearAll = () => {
    setSelectedNotebook('');
    setSelectedTags([]);
    setCreatedFrom('');
    setCreatedTo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div
        ref={modalRef}
        className="relative w-[400px] bg-[#181818] rounded-2xl shadow-2xl px-8 py-7 flex flex-col gap-7"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-white">Add Filters</span>
          <button
            className="text-sm text-[#b3b3b3] hover:text-white font-medium px-2 py-1 rounded transition-colors"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>
        {/* Filter Rows */}
        <div className="flex flex-col gap-6">
          {/* Tags */}
          <div className="flex items-center gap-4">
            <Tag className="w-5 h-5 text-white" />
            <span className="font-medium text-white w-[90px]">Tags</span>
            <div className="flex-1">
              <div className="relative">
                <select
                  className="appearance-none w-full bg-[#232323] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#333] pr-8"
                  value={selectedTags[0] || ''}
                  onChange={e => setSelectedTags(e.target.value ? [e.target.value] : [])}
                >
                  <option value="" className="text-[#b3b3b3]">Select</option>
                  {tags.map(tag => (
                    <option key={tag._id} value={tag._id} className="bg-[#23272B] text-white">{tag.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]">
                  ▼
                </span>
              </div>
            </div>
          </div>
          {/* Located in */}
          <div className="flex items-center gap-4">
            <Book className="w-5 h-5 text-white" />
            <span className="font-medium text-white w-[90px]">Located in</span>
            <div className="flex-1">
              <div className="relative">
                <select
                  className="appearance-none w-full bg-[#232323] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#333] pr-8"
                  value={selectedNotebook}
                  onChange={e => setSelectedNotebook(e.target.value)}
                >
                  <option value="" className="text-[#b3b3b3]">Notebook</option>
                  {notebooks.map(nb => (
                    <option key={nb._id} value={nb._id} className="bg-[#23272B] text-white">{nb.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]">
                  ▼
                </span>
              </div>
            </div>
          </div>
          {/* Created */}
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-white" />
            <span className="font-medium text-white w-[90px]">Created</span>
            <div className="flex-1">
              <input
                type="date"
                className="w-full bg-[#232323] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#333] placeholder-[#b3b3b3]"
                value={createdFrom}
                onChange={e => setCreatedFrom(e.target.value)}
                placeholder="Date"
              />
            </div>
          </div>
          {/* Updated */}
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-white" />
            <span className="font-medium text-white w-[90px]">Updated</span>
            <div className="flex-1">
              <input
                type="date"
                className="w-full bg-[#232323] border border-[#333] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#333] placeholder-[#b3b3b3]"
                value={createdTo}
                onChange={e => setCreatedTo(e.target.value)}
                placeholder="Date"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
