import { useState, useRef, useEffect } from 'react';
import analyticsService from '@services/analytics';

type MenuItem = {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
};

type HamburgerMenuProps = {
  menuItems: MenuItem[];
};

const HamburgerMenu = ({ menuItems }: HamburgerMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        // Return focus to the menu button when closing
        if (menuButtonRef.current) {
          menuButtonRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        ref={menuButtonRef}
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          if (newIsOpen) {
            analyticsService.logNavigation('home');
            // Focus the first menu item when the menu opens
            setTimeout(() => {
              if (firstMenuItemRef.current) {
                firstMenuItemRef.current.focus();
              }
            }, 100);
          }
        }}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          color: 'var(--text-primary)',
          padding: 8,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ☰
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '70%',
              maxWidth: 300,
              height: '100%',
              backgroundColor: 'var(--bg-surface-elevated)',
              zIndex: 1000,
              boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
              transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-default)'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: 'var(--text-primary)'
                }}
              >
                Menu
              </h2>
            </div>
            <nav>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}
              >
                {menuItems.map((item, index) => (
                  <li key={item.id}>
                    <button
                      ref={index === 0 ? firstMenuItemRef : null}
                      onClick={() => {
                        item.onClick();
                        setIsOpen(false);
                        // Return focus to the menu button when closing
                        if (menuButtonRef.current) {
                          menuButtonRef.current.focus();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      {item.icon && (
                        <span style={{ marginRight: '12px' }}>{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default HamburgerMenu;
