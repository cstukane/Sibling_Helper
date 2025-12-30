import { useState } from 'react';
import Home from '@pages/Home';
import RewardShop from '@pages/RewardShop';
import Settings from '@pages/Settings';
import PendingSubmissions from '@pages/PendingSubmissions';
import { ThemeProvider } from '@components/ThemeProvider';
import './assets/theme.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'rewards' | 'settings' | 'pending'>('home');

  const navigateToRewards = () => {
    setCurrentView('rewards');
  };

  const navigateToHome = () => {
    setCurrentView('home');
  };

  const navigateToSettings = () => {
    setCurrentView('settings');
  };

  const navigateToPending = () => {
    setCurrentView('pending');
  };

  return (
    <ThemeProvider>
      <div style={{ 
        fontFamily: 'system-ui, sans-serif', 
        padding: 16, 
        position: 'relative', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-surface)'
      }}>
        {currentView === 'home' ? (
          <Home 
            onNavigateToRewards={navigateToRewards}
            onNavigateToSettings={navigateToSettings}
            onNavigateToPending={navigateToPending}
          />
        ) : currentView === 'rewards' ? (
          <RewardShop />
        ) : currentView === 'settings' ? (
          <Settings />
        ) : (
          <PendingSubmissions />
        )}
        
        {currentView !== 'home' && (
          <footer style={{ 
            position: 'fixed', 
            bottom: 16, 
            left: 16, 
            right: 16,
            textAlign: 'center'
          }}>
            <button
              onClick={navigateToHome}
              className="themed-button primary"
              style={{
                padding: '12px 24px',
                borderRadius: 24,
                fontWeight: 'bold'
              }}
            >
              ← Back to Quests
            </button>
          </footer>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
