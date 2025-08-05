import React, { useState, useEffect } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useUIStore } from '../../stores/useUIStore';

interface ImportExportModalProps {
  mode: 'import' | 'export';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ mode }) => {
  const { notes, importNotes, exportNotes, currentNote } = useNotesStore();
  const { closeImportExportModal, importExportModalOpen } = useUIStore();
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'txt' | 'md'>('json');
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (mode === 'export' && currentNote && selectedNotes.length === 0) {
      setSelectedNotes([currentNote._id]);
    }
  }, [mode, currentNote]);

  const handleExport = async () => {
    if (selectedNotes.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one note to export.' });
      return;
    }

    setIsProcessing(true);
    try {
      await exportNotes(selectedNotes, selectedFormat);
      setMessage({ type: 'success', text: 'Notes exported successfully!' });
      setTimeout(() => closeImportExportModal(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export notes. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      await importNotes(file, selectedFormat);
      setMessage({ type: 'success', text: 'Notes imported successfully!' });
      setTimeout(() => closeImportExportModal(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import notes. Please check the file format.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map(note => note._id));
    }
  };

  if (!importExportModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {mode === 'import' ? (
              <Upload className="w-6 h-6 text-blue-600" />
            ) : (
              <Download className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-semibold">
              {mode === 'import' ? 'Import Notes' : 'Export Notes'}
            </h2>
          </div>
          <button
            onClick={closeImportExportModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'json', label: 'JSON', description: 'Full data with metadata' },
                { id: 'txt', label: 'Plain Text', description: 'Simple text format' },
                { id: 'md', label: 'Markdown', description: 'Rich text format' }
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id as 'json' | 'txt' | 'md')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-gray-500">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          {mode === 'export' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Select Notes to Export</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedNotes.length === notes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {notes.map((note) => (
                  <label
                    key={note._id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(note._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotes([...selectedNotes, note._id]);
                        } else {
                          setSelectedNotes(selectedNotes.filter(id => id !== note._id));
                        }
                      }}
                      className="rounded"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{note.title}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {note.primaryNotebookId?.name || 'Unknown Notebook'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div>
              <h3 className="text-lg font-medium mb-3">Upload File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Choose a file to import your notes
                </p>
                <input
                  type="file"
                  accept={selectedFormat === 'json' ? '.json' : selectedFormat === 'txt' ? '.txt' : '.md'}
                  onChange={handleImport}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={closeImportExportModal}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          {mode === 'export' && (
            <button
              onClick={handleExport}
              disabled={isProcessing || selectedNotes.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Exporting...' : 'Export Notes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 