import { useState } from 'react';
import Home from '@pages/Home';
import ParentMode from '@pages/ParentMode';
import RewardShop from '@pages/RewardShop';
import ParentModeToggle from '@components/ParentModeToggle';
import { ThemeProvider, useTheme } from '@sibling-helper/shared';

const AppContent = () => {
  const { isDark } = useTheme();
  const [isParentMode, setIsParentMode] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'rewards'>('home');

  const handleParentModeChange = (isParent: boolean) => {
    setIsParentMode(isParent);
    if (isParent) {
      setCurrentView('home');
    }
  };

  const navigateToRewards = () => {
    setCurrentView('rewards');
  };

  const navigateToHome = () => {
    setCurrentView('home');
  };

  return (
    <div
      className={isDark ? 'dark' : ''}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 16,
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f8fafc' : '#000000'
      }}
    >
      {isParentMode ? (
        <ParentMode />
      ) : currentView === 'home' ? (
        <Home onNavigateToRewards={navigateToRewards} />
      ) : (
        <RewardShop />
      )}

      {!isParentMode && currentView === 'rewards' && (
        <footer
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            textAlign: 'center'
          }}
        >
          <button
            onClick={navigateToHome}
            style={{
              padding: '12px 24px',
              background: isDark ? '#1e293b' : '#0ea5e9',
              color: 'white',
              border: isDark ? '1px solid #334155' : 'none',
              borderRadius: 24,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ƒ+? Back to Quests
          </button>
        </footer>
      )}

      <div style={{ position: 'fixed', bottom: 16, right: 16 }}>
        <ParentModeToggle onParentModeChange={handleParentModeChange} />
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
