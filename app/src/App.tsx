import { useState, useEffect } from 'react';
import Home from '@pages/Home';
import ParentMode from '@pages/ParentMode';
import RewardShop from '@pages/RewardShop';
import ParentModeToggle from '@components/ParentModeToggle';

function App() {
  const [isParentMode, setIsParentMode] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'rewards'>('home');

  // Apply theme on app load
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      // Apply dark theme to document
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleParentModeChange = (isParent: boolean) => {
    setIsParentMode(isParent);
    if (isParent) {
      setCurrentView('home'); // Reset to home when entering parent mode
    }
  };

  const navigateToRewards = () => {
    setCurrentView('rewards');
  };

  const navigateToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className={document.body.classList.contains('dark') ? 'dark' : ''}
         style={{ 
           fontFamily: 'system-ui, sans-serif', 
           padding: 16, 
           position: 'relative', 
           minHeight: '100vh',
           backgroundColor: document.body.classList.contains('dark') ? '#0f172a' : '#ffffff',
           color: document.body.classList.contains('dark') ? '#f8fafc' : '#000000'
         }}>
      {isParentMode ? (
        <ParentMode />
      ) : currentView === 'home' ? (
        <Home onNavigateToRewards={navigateToRewards} />
      ) : (
        <RewardShop />
      )}
      
      {!isParentMode && currentView === 'rewards' && (
        <footer style={{ 
          position: 'fixed', 
          bottom: 16, 
          left: 16, 
          right: 16,
          textAlign: 'center'
        }}>
          <button
            onClick={navigateToHome}
            style={{
              padding: '12px 24px',
              background: document.body.classList.contains('dark') ? '#1e293b' : '#0ea5e9',
              color: 'white',
              border: document.body.classList.contains('dark') ? '1px solid #334155' : 'none',
              borderRadius: 24,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ← Back to Quests
          </button>
        </footer>
      )}
      
      {/* Small Parent Mode Toggle in Bottom Right */}
      <div style={{ position: 'fixed', bottom: 16, right: 16 }}>
        <ParentModeToggle onParentModeChange={handleParentModeChange} />
      </div>
    </div>
  );
}

export default App;
