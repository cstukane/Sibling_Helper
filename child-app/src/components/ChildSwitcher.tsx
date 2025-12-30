import React, { useState, useEffect, useRef } from 'react';

interface ChildProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  points: number;
}

type ChildSwitcherProps = {
  currentChildId: string;
  childrenProfiles: ChildProfile[];
  onSelectChild: (childId: string) => void;
  onClose: () => void;
};

const ChildSwitcher: React.FC<ChildSwitcherProps> = ({ 
  currentChildId, 
  childrenProfiles, 
  onSelectChild, 
  onClose 
}) => {
  const [isSwitching, setIsSwitching] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleSelectChild = async (childId: string) => {
    if (childId === currentChildId) {
      onClose();
      return;
    }
    
    setIsSwitching(true);
    
    try {
      // In a real app, you would:
      // 1. Validate the child ID
      // 2. Switch the active child
      // 3. Refresh any cached data
      // 4. Update local storage
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store active child ID
      localStorage.setItem('active_child_id', childId);
      
      // Notify parent component
      onSelectChild(childId);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error switching child:', error);
      // In a real app, you would show an error message
    } finally {
      setIsSwitching(false);
    }
  };

  // Focus management and keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Focus the close button when modal opens
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scrolling when modal closes
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="child-switcher-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        padding: 0,
        borderRadius: 12,
        maxWidth: 400,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid var(--border-default)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--border-default)'
        }}>
          <h2 
            id="child-switcher-title"
            style={{ 
              margin: 0,
              color: 'var(--text-primary)'
            }}
          >Switch Child</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ 
          maxHeight: '60vh', 
          overflowY: 'auto',
          padding: '8px 0'
        }}>
          {childrenProfiles.map((child) => (
            <button
              key={child.id}
              onClick={() => handleSelectChild(child.id)}
              disabled={isSwitching}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: isSwitching ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                position: 'relative'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
                marginRight: 12
              }}>
                {child.avatarUrl ? (
                  <img 
                    src={child.avatarUrl} 
                    alt={child.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }} 
                  />
                ) : (
                  child.name.charAt(0)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 'bold',
                  marginBottom: 4
                }}>
                  {child.name}
                </div>
                <div style={{ 
                  fontSize: 14, 
                  color: 'var(--text-secondary)'
                }}>
                  Total points: {child.points}
                </div>
              </div>
              {child.id === currentChildId && (
                <div style={{ 
                  color: 'var(--accent-primary)',
                  fontWeight: 'bold'
                }}>
                  Active
                </div>
              )}
              {isSwitching && child.id === currentChildId && (
                <div style={{ 
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}>
                  <div className="spinner" style={{
                    width: 20,
                    height: 20,
                    border: '2px solid var(--border-muted)',
                    borderTop: '2px solid var(--accent-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div style={{ 
          padding: '16px',
          borderTop: '1px solid var(--border-default)',
          textAlign: 'center'
        }}>
          <button style={{ 
            padding: '8px 16px',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            background: 'var(--bg-surface-elevated)',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
            fontWeight: '500'
          }}>
            Add Child
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .spinner {
          position: absolute;
          left: 50%;
          top: 50%;
        }
      `}</style>
    </div>
  );
};

export default ChildSwitcher;