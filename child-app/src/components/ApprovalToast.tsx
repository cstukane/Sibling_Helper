import { useState, useEffect, useRef } from 'react';

type ApprovalToastProps = {
  isVisible: boolean;
  onDismiss: () => void;
};

const ApprovalToast = ({ isVisible, onDismiss }: ApprovalToastProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const toastRef = useRef<HTMLDivElement>(null);

  // Only show if not dismissed
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('approval_notice_dismissed') === 'true';
    setShouldShow(isVisible && !isDismissed);
  }, [isVisible]);

  useEffect(() => {
    if (!shouldShow || !toastRef.current) return;

    // Focus the toast when it appears
    toastRef.current.focus();

    // Automatically dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [shouldShow]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('approval_notice_dismissed', 'true');
    }
    setShouldShow(false);
    onDismiss();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      ref={toastRef}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--accent-primary)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: 8,
        zIndex: 1000,
        maxWidth: '90%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div>
        Submissions need approval before points are added.
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <span>Don't show again</span>
        </label>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ApprovalToast;
