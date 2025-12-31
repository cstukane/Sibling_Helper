import React from 'react';
import { createRoot } from 'react-dom/client';
import AppBootstrap from './AppBootstrap';
import ErrorBoundary from './components/ErrorBoundary';
import './assets/darkMode.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppBootstrap />
    </ErrorBoundary>
  </React.StrictMode>
);
