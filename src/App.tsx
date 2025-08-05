import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import { useToastStore } from './stores/useToastStore';
import { Toast } from './components/notes/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AllNotes from './pages/AllNotes';
import Notebooks from './pages/Notebooks';
import Tags from './pages/Tags';

import Calendar from './pages/Calendar';
import Shortcuts from './pages/Shortcuts';
import SharedWithMe from './pages/SharedWithMe';
import SharedNoteView from './pages/SharedNoteView';
import Trash from './pages/Trash';
import LiteEditor from './pages/LiteEditor';
import Layout from './components/layout/Layout';
import SearchModal from './components/modals/SearchModal';
import { CustomizeModal } from './components/modals/CustomizeModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { ImportExportModal } from './components/modals/ImportExportModal';
import NoteTemplates from './components/notes/NoteTemplates';
import NotebookNotes from './pages/NotebookNotes';
import Templates from './pages/Templates';

function App() {
  const { isLoading, verifyToken, isAuthenticated } = useAuthStore();
  const { 
    searchModalOpen, 
    templatesModalOpen, 
    keyboardShortcutsModalOpen,
    importExportMode
  } = useUIStore();
  const { message, type, isVisible } = useToastStore();

  // Verify token on app initialization
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Toast message={message} type={type} isVisible={isVisible} />
          <Routes>
            {/* Standalone public shared note view (always outside layout) */}
            <Route path="/note/:noteId" element={<SharedNoteView />} />

            {/* Standalone Lite Editor route (no sidebar/layout) */}
            <Route path="/lite-editor/:noteId" element={<LiteEditor />} />

            {/* Auth routes - redirect to dashboard if already authenticated */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
            />

            {/* All other routes with sidebar/layout - require authentication */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/notes" element={<AllNotes />} />
                      <Route path="/notebooks" element={<Notebooks />} />
                      <Route path="/notebooks/:id" element={<NotebookNotes />} />
                      <Route path="/tags" element={<Tags />} />

                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/shortcuts" element={<Shortcuts />} />
                      <Route path="/shared" element={<SharedWithMe />} />
                      <Route path="/trash" element={<Trash />} />
                      <Route path="/templates" element={<Templates />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>

          {/* Modals */}
          <SearchModal isOpen={searchModalOpen} onClose={() => useUIStore.getState().toggleSearchModal()} />
          <CustomizeModal />
          <KeyboardShortcutsModal isOpen={keyboardShortcutsModalOpen} onClose={() => useUIStore.getState().toggleKeyboardShortcutsModal()} />
          <ImportExportModal mode={importExportMode} />
          <NoteTemplates isOpen={templatesModalOpen} onClose={() => useUIStore.getState().toggleTemplatesModal()} />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;