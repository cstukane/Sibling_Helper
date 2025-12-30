import React, { useState, useEffect, useRef } from 'react';

type ConfirmSubmitModalProps = {
  taskName: string;
  points?: number;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmSubmitModal: React.FC<ConfirmSubmitModalProps> = ({ 
  taskName, 
  points, 
  onConfirm, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Focus the cancel button when the modal opens and handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    // Focus the cancel button when modal opens
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body scrolling when modal closes
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
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
      <div
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: 24,
          borderRadius: 12,
          maxWidth: 400,
          width: '90%',
          border: '1px solid var(--border-default)'
        }}
      >
        <h2 
          id="confirm-modal-title"
          style={{ 
            margin: '0 0 16px 0', 
            textAlign: 'center',
            color: 'var(--text-primary)'
          }}
        >Submit task?</h2>
        
        <p style={{ 
          fontSize: 18, 
          margin: '16px 0', 
          textAlign: 'center',
          fontWeight: 'bold',
          color: 'var(--text-primary)'
        }}>
          {taskName}
        </p>
        
        {points && (
          <p style={{ 
            margin: '16px 0', 
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            Earn {points} points
          </p>
        )}
        
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isSubmitting}
            className="themed-button secondary"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="themed-button primary"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubmitModal;