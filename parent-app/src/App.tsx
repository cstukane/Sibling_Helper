import ParentMode from '@pages/ParentMode';
import './assets/darkMode.css';
import { ThemeProvider, useTheme } from '@sibling-helper/shared';

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={isDark ? 'dark' : ''}
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 16,
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        color: isDark ? '#f8fafc' : '#000000',
        border: '1px solid var(--frame-border)'
      }}
    >
      <ParentMode />
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
