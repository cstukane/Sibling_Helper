import { useCallback, useEffect, useState } from 'react';
import { LoadingIndicator } from '@sibling-helper/shared';
import App from './App';
import { initializeDatabase } from './data/initialize';

type InitStatus = 'loading' | 'ready' | 'error';

const AppBootstrap = () => {
  const [status, setStatus] = useState<InitStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(false);

  const runInitialization = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    setForceRender(false);
    try {
      await initializeDatabase();
      setStatus('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize local data.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    runInitialization();
  }, [runInitialization]);

  if (status === 'loading') {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <LoadingIndicator label="Loading your data..." />
        <p style={{ margin: '12px 0 0 0' }}>This should only take a moment.</p>
      </div>
    );
  }

  if (status === 'error' && !forceRender) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ marginTop: 0 }}>We hit a snag</h1>
        <p style={{ marginBottom: 16 }}>{errorMessage || 'Failed to initialize local data.'}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={runInitialization}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #0ea5e9',
              background: '#0ea5e9',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
          <button
            onClick={() => setForceRender(true)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5f5',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Continue anyway
          </button>
        </div>
      </div>
    );
  }

  return <App />;
};

export default AppBootstrap;
