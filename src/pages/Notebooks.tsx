import React from 'react';
import NotebookNotes from './NotebookNotes';

const Notebooks: React.FC = () => {
  return (
    <div style={{ background: '#181818', minHeight: '100vh', color: '#fff', width: '100%' }}>
      <NotebookNotes />
    </div>
  );
};

export default Notebooks;