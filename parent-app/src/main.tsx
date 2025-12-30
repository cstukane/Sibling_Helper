import React from 'react';
import { createRoot } from 'react-dom/client';
import { initializeDatabase } from './data/initialize';
import App from './App';
import './assets/darkMode.css';

// Initialize the database before rendering the app
initializeDatabase()
  .then(() => {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root container missing');
    createRoot(container).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    // Still render the app even if database initialization fails
    const container = document.getElementById('root');
    if (!container) throw new Error('Root container missing');
    createRoot(container).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });