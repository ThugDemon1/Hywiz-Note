import React, { useEffect, useState } from 'react';
import { Plus, Search, Tag, Hash, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useTagsStore } from '../stores/useTagsStore';

export const Tags: React.FC = () => {
  const { tags, fetchTags, createTag, deleteTag } = useTagsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTag = async (name: string, color: string, description: string) => {
    try {
      await createTag({ name, color, description });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const tagColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">Tags</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Tag</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Tags Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTags.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No tags found' : 'No tags yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms'
                      : 'Create tags to organize and categorize your notes'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Tag
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTags.map((tag) => (
                  <div
                    key={tag._id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <Hash className="w-4 h-4 text-gray-400" />
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">{tag.name}</h3>
                    
                    {tag.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {tag.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{tag.noteCount} notes</span>
                      <span>{new Date(tag.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {showCreateModal && (
        <CreateTagModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTag}
          availableColors={tagColors}
        />
      )}
    </div>
  );
};

// Create Tag Modal Component
const CreateTagModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, color: string, description: string) => void;
  availableColors: string[];
}> = ({ onClose, onCreate, availableColors }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), selectedColor, description.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#181818] rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Tag</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-400 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this tag is for..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Tags;