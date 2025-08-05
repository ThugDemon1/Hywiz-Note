import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Home, 
  Zap, 
  FileText, 
  Book, 
  Users, 
  Bell, 
  Tag, 
  Trash2, 
  HelpCircle,
  ChevronDown,
  Settings,
  Menu,
  Calendar,
  BookOpen,
  ChevronLeft, // Add ChevronLeft for collapse/expand
  ChevronRight, // Add ChevronRight for collapse/expand
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useUIStore } from '../../stores/useUIStore';
import { useNotebooksStore } from '../../stores/useNotebooksStore';

const navigationItems = [
  { id: 'dashboard', name: 'Home', icon: Home, path: '/' },
  { id: 'shortcuts', name: 'Shortcuts', icon: Zap, path: '/shortcuts', badge: 3 },
  { id: 'notes', name: 'Notes', icon: FileText, path: '/notes' },
  { id: 'notebooks', name: 'Notebooks', icon: Book, path: '/notebooks' },
  { id: 'templates', name: 'Templates', icon: BookOpen, path: '/templates' },
  { id: 'shared', name: 'Shared with Me', icon: Users, path: '/shared' },

  { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'tags', name: 'Tags', icon: Tag, path: '/tags' },
  { id: 'trash', name: 'Trash', icon: Trash2, path: '/trash' }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { createNote, setCurrentNote, notes, fetchNotes } = useNotesStore();
  const { openCustomizeModal, toggleSearchModal } = useUIStore();
  const { notebooks, createNotebook, fetchNotebooks, setCurrentNotebook } = useNotebooksStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notebooksDropdownOpen, setNotebooksDropdownOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [creatingNotebook, setCreatingNotebook] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);

  // Fetch notebooks on mount
  React.useEffect(() => { fetchNotebooks(); }, [fetchNotebooks]);

  const handleCreateNote = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated');
        navigate('/login');
        return;
      }
      
      console.log('Creating new note...');
      const newNote = await createNote({
        title: '',
        // content: '',
        // plainTextContent: ''
      });
      
      console.log('Note created, navigating to editor...');
      
      // Set the current note in the store
      setCurrentNote(newNote);
      
      // Navigate to notes page with the new note selected
      navigate(`/notes?note=${newNote._id}`);
      setIsMobileOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
      // You might want to show a toast notification here
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleSearchClick = () => {
    toggleSearchModal();
    setIsMobileOpen(false);
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    setCreatingNotebook(true);
    try {
      const nb = await createNotebook({ name: newNotebookName.trim() });
      setNewNotebookName('');
      setCreatingNotebook(false);
      setNotebooksDropdownOpen(false);
      setCurrentNotebook(nb);
      navigate(`/notebooks/${nb._id}`);
      setShowNotebookModal(false);
    } catch (err) {
      setCreatingNotebook(false);
    }
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${isCollapsed ? 'w-16' : 'w-64'} bg-[#202124] border-r border-[#23272B] font-[Segoe UI,Helvetica Neue,Arial,sans-serif] transition-all duration-300 relative`}> 
      {/* Floating Chevron Button */}
      <button
        className="hidden lg:flex items-center justify-center absolute z-20 top-1/2 -right-3 transform -translate-y-1/2 w-8 h-8 rounded-full bg-[#23272B] shadow-lg border border-[#23272B] hover:bg-[#23272B]/90 focus:bg-[#23272B]/90 transition-colors group focus:outline-none"
        style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.13)' }}
        onClick={() => setIsCollapsed((v) => !v)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        tabIndex={0}
      >
        <span className="flex items-center justify-center transition-transform duration-300">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-[#A3A7AB] group-hover:text-white group-focus:text-white transition-colors" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-[#A3A7AB] group-hover:text-white group-focus:text-white transition-colors" />
          )}
        </span>
      </button>
      {/* User Profile */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-2 sm:px-4 py-4 border-b border-[#23272B]`}> 
        <div className="w-10 h-10 bg-[#4285f4] rounded-full flex items-center justify-center text-base font-semibold text-white shadow-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold truncate text-white">{user?.name || 'User'}</span>
              <ChevronDown className="w-4 h-4 text-[#A3A7AB] flex-shrink-0" />
            </div>
            <div className="text-xs text-[#A3A7AB] truncate">{user?.email || 'user@example.com'}</div>
          </div>
        )}
      </div>
      {/* Search Bar */}
      <div className={`py-3 ${isCollapsed ? 'px-1' : 'px-4'}`}> 
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A7AB]" />
          <input
            type="text"
            placeholder="Search"
            onClick={handleSearchClick}
            className={`w-full h-10 bg-[#23272B] text-white ${isCollapsed ? 'pl-10 pr-0' : 'pl-10 pr-3'} rounded-lg text-sm border border-[#23272B] focus:outline-none focus:border-[#4285f4] cursor-pointer ${isCollapsed ? 'opacity-0 pointer-events-none' : ''}`}
            readOnly
          />
        </div>
      </div>
      {/* New Note Button */}
      <div className={`pb-3 ${isCollapsed ? 'px-1' : 'px-4'}`}> 
        <button 
          onClick={handleCreateNote}
          className={`w-full h-10 bg-[#00A82D] hover:bg-[#009A28] focus:bg-[#009A28] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${isCollapsed ? 'justify-center' : ''} focus:outline-none`}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Note</span>}
        </button>
      </div>
      {/* Quick Actions (placeholder for future) */}
      <div className={`pb-3 ${isCollapsed ? 'px-1' : 'px-4'}`}> 
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-[#23272B] hover:bg-[#23272B]/80 focus:bg-[#23272B]/90 text-[#A3A7AB] h-10 rounded-lg text-sm font-normal flex items-center justify-center gap-2 border border-[#23272B] transition-colors focus:outline-none">
            <Zap className="w-5 h-5" />
            {!isCollapsed && <span>Task</span>}
          </button>
          <button className="bg-[#23272B] hover:bg-[#23272B]/80 focus:bg-[#23272B]/90 text-[#A3A7AB] h-10 rounded-lg text-sm font-normal flex items-center justify-center gap-2 border border-[#23272B] transition-colors focus:outline-none">
            <Calendar className="w-5 h-5" />
            {!isCollapsed && <span>Event</span>}
          </button>
        </div>
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="flex flex-col gap-1">
          {navigationItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            if (item.id === 'notebooks') {
              return (
                <React.Fragment key={item.id}>
                  <li className="flex flex-col">
                    <button
                      onClick={() => setNotebooksDropdownOpen((v) => !v)}
                      className={`flex items-center gap-3 h-10 ${isCollapsed ? 'px-1 justify-center' : 'px-4'} rounded-lg text-sm font-normal transition-colors w-full text-left ${
                        isActive
                          ? 'bg-[#23272B] text-white shadow'
                          : 'text-[#A3A7AB] hover:bg-[#23272B] hover:text-white focus:bg-[#23272B] focus:text-white'
                      } focus:outline-none`}
                    >
                      <IconComponent className="w-5 h-5" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                      {!isCollapsed && <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${notebooksDropdownOpen ? 'rotate-180' : ''}`} />}
                    </button>
                    {/* Inline notebooks list */}
                    {!isCollapsed && notebooksDropdownOpen && (
                      <ul className="ml-8 mt-1">
                        {notebooks.map((nb) => (
                          <li key={nb._id} className="text-[#A3A7AB] hover:text-white cursor-pointer py-1 text-xs md:text-sm" onClick={() => {
                            setCurrentNotebook(nb);
                            navigate(`/notebooks/${nb._id}`);
                          }}>{nb.name}</li>
                        ))}
                        <li>
                          <button onClick={() => setShowNotebookModal(true)} className="text-[#4285f4] hover:underline text-xs md:text-sm mt-1">+ New Notebook</button>
                        </li>
                      </ul>
                    )}
                  </li>
                </React.Fragment>
              );
            }
            // Default nav item
            return (
              <li key={item.id}>
                <button
                  onClick={async () => {
                    if (item.id === 'notes') {
                      if (!notes || notes.length === 0) {
                        await fetchNotes();
                      }
                      const firstNote = notes && notes.length > 0 ? notes[0] : null;
                      if (firstNote) {
                        navigate(`/notes?note=${firstNote._id}`);
                      } else {
                        navigate(item.path);
                      }
                      setIsMobileOpen(false);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  className={`flex items-center gap-3 h-10 ${isCollapsed ? 'px-1 justify-center' : 'px-4'} rounded-lg text-sm font-normal transition-colors w-full text-left ${
                    isActive 
                      ? 'bg-[#23272B] text-white shadow'
                      : 'text-[#A3A7AB] hover:bg-[#23272B] hover:text-white focus:bg-[#23272B] focus:text-white'
                  } focus:outline-none`}
                >
                  <IconComponent className="w-5 h-5" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Bottom Section */}
      <div className={`py-4 border-t border-[#23272B] flex flex-col gap-2 ${isCollapsed ? 'px-1' : 'px-4'}`}> 
        <button
          onClick={() => {
            openCustomizeModal();
            setIsMobileOpen(false);
          }}
          className={`flex items-center gap-3 h-10 ${isCollapsed ? 'px-1 justify-center' : 'px-4'} rounded-lg text-sm text-[#A3A7AB] hover:text-white hover:bg-[#23272B] focus:bg-[#23272B] focus:text-white transition-colors w-full text-left focus:outline-none`}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <div className={`flex items-center gap-3 h-10 ${isCollapsed ? 'px-1 justify-center' : 'px-4'} text-sm text-[#A3A7AB]`}>
          <HelpCircle className="w-5 h-5" />
          {!isCollapsed && <span>Need help?</span>}
        </div>
        <button
          onClick={() => {
            logout();
            setIsMobileOpen(false);
          }}
          className={`flex items-center gap-3 h-10 ${isCollapsed ? 'px-1 justify-center' : 'px-4'} rounded-lg text-sm text-[#A3A7AB] hover:text-white hover:bg-[#23272B] focus:bg-[#23272B] focus:text-white transition-colors w-full text-left focus:outline-none`}
        >
          {!isCollapsed && <span>Sign Out</span>}
          <span className="sr-only">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-gray-800 text-white flex-col h-full transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white flex flex-col transform transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 z-50 p-2 rounded-full bg-[#23272B] hover:bg-[#23272B]/90 focus:bg-[#23272B]/90 text-white focus:outline-none shadow-lg"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {sidebarContent}
      </div>
    </>
  );
};