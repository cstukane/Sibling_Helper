import React, { useState, useEffect } from 'react';
import ParentLinking from '@components/ParentLinking';
import ChildSwitcher from '@components/ChildSwitcher';
import { useTheme } from '@components/ThemeProvider';
import analyticsService from '@services/analytics';

const Settings: React.FC = () => {
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [showParentLinking, setShowParentLinking] = useState(false);
  const [showChildSwitcher, setShowChildSwitcher] = useState(false);
  const [activeChildId, setActiveChildId] = useState('child-1');
  const [childrenProfiles] = useState([
    { id: 'child-1', name: 'Child 1', points: 1250 },
    { id: 'child-2', name: 'Child 2', points: 875 },
    { id: 'child-3', name: 'Child 3', points: 2100 }
  ]);

  // Load active child
  useEffect(() => {
    const savedActiveChildId = localStorage.getItem('active_child_id');
    if (savedActiveChildId) {
      setActiveChildId(savedActiveChildId);
    }
    
    // Log when settings is opened
    analyticsService.logSettings();
  }, []);

  const handleThemeChange = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    
    // Log appearance change
    analyticsService.logAppearanceChange(mode);
  };

  const handleChildSwitch = (childId: string) => {
    setActiveChildId(childId);
    // In a real app, you would refresh queries and invalidate caches here
    
    // Log child switch
    analyticsService.logChildSwitch(childId);
  };

  if (showParentLinking) {
    return (
      <ParentLinking 
        onLinkSuccess={(parentId) => {
          setShowParentLinking(false);
          // In a real app, you would store the parent ID
          localStorage.setItem('linked_parent_id', parentId);
          // Show success message
          alert("You're linked!");
        }}
        onBack={() => setShowParentLinking(false)}
      />
    );
  }

  if (showChildSwitcher) {
    return (
      <ChildSwitcher
        currentChildId={activeChildId}
        childrenProfiles={childrenProfiles}
        onSelectChild={handleChildSwitch}
        onClose={() => setShowChildSwitcher(false)}
      />
    );
  }

  // Get active child profile
  const activeChild = childrenProfiles.find(child => child.id === activeChildId) || childrenProfiles[0];

  return (
    <section style={{ padding: 16 }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={() => window.history.back()}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: 24, 
            cursor: 'pointer',
            padding: 0,
            marginRight: 16,
            color: 'var(--text-primary)'
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Settings</h1>
      </header>
      
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ 
          marginBottom: 16,
          color: 'var(--text-primary)'
        }}>Appearance</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 12
        }}>
          <button
            onClick={() => handleThemeChange('system')}
            style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              background: themeMode === 'system' ? 'var(--bg-surface-overlay)' : 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--text-primary)'
            }}
          >
            <span>Use System</span>
            {themeMode === 'system' && <span>✓</span>}
          </button>
          
          <button
            onClick={() => handleThemeChange('light')}
            style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              background: themeMode === 'light' ? 'var(--bg-surface-overlay)' : 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--text-primary)'
            }}
          >
            <span>Light</span>
            {themeMode === 'light' && <span>✓</span>}
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              background: themeMode === 'dark' ? 'var(--bg-surface-overlay)' : 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--text-primary)'
            }}
          >
            <span>Dark</span>
            {themeMode === 'dark' && <span>✓</span>}
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ 
          marginBottom: 16,
          color: 'var(--text-primary)'
        }}>Account</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            background: 'var(--bg-surface-elevated)'
          }}>
            <div>
              <div style={{ 
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>Active Profile</div>
              <div style={{ 
                fontSize: 14, 
                color: 'var(--text-secondary)'
              }}>{activeChild.name}</div>
            </div>
            <button 
              onClick={() => setShowChildSwitcher(true)}
              style={{ 
                padding: '8px 16px',
                border: '1px solid var(--accent-primary)',
                borderRadius: 4,
                background: 'var(--bg-surface-elevated)',
                color: 'var(--accent-primary)',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>
          
          <button 
            onClick={() => setShowParentLinking(true)}
            style={{ 
              padding: '16px',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              background: 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--text-primary)'
            }}
          >
            Link to Parent
          </button>
        </div>
      </div>
      
      <div>
        <h2 style={{ 
          marginBottom: 16,
          color: 'var(--text-primary)'
        }}>About</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 12
        }}>
          <button style={{ 
            padding: '16px',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            background: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)'
          }}>
            Help & Support
          </button>
          
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            background: 'var(--bg-surface-elevated)'
          }}>
            <div>
              <div style={{ 
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}>Version</div>
              <div style={{ 
                fontSize: 14, 
                color: 'var(--text-secondary)'
              }}>1.4.0 (build 123)</div>
            </div>
          </div>
          
          <button style={{ 
            padding: '16px',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            background: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--state-error)'
          }}>
            Log out
          </button>
        </div>
      </div>
    </section>
  );
};

export default Settings;
