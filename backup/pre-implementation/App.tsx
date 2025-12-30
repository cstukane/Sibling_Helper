import React, { useState, useEffect } from 'react';
import ParentMode from '@pages/ParentMode';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme on app load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const darkMode = savedDarkMode === 'true';
    setIsDarkMode(darkMode);
    
    // Apply dark theme to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className={isDarkMode ? 'dark' : ''}
         style={{ 
           fontFamily: 'system-ui, sans-serif', 
           padding: 16, 
           position: 'relative', 
           minHeight: '100vh',
           backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
           color: isDarkMode ? '#f8fafc' : '#000000'
         }}>
      <ParentMode />
    </div>
  );
}

export default App;