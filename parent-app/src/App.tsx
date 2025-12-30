import { useState, useEffect } from 'react';
import ParentMode from '@pages/ParentMode';
import './assets/darkMode.css';

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
    
    // Apply border color if saved
    const savedBorderColor = localStorage.getItem('borderColor');
    if (savedBorderColor && savedBorderColor !== 'system') {
      document.documentElement.style.setProperty('--frame-border', savedBorderColor);
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
           color: isDarkMode ? '#f8fafc' : '#000000',
           // Apply frame border using CSS variable
           border: '1px solid var(--frame-border)'
         }}>
      <ParentMode />
    </div>
  );
}

export default App;
