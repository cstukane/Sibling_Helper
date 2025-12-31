import React, { useId, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

export type QuestCompletionModalProps = {
  questTitle: string;
  points: number;
  onConfirm: () => void;
  onCancel: () => void;
};

const QuestCompletionModal: React.FC<QuestCompletionModalProps> = ({ 
  questTitle, 
  points, 
  onConfirm, 
  onCancel 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const helperTextId = useId();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: 16 }} role="alert">
          Unable to load the quest completion dialog.
        </div>
      }
    >
      <div
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={`${descriptionId} ${helperTextId}`}
          aria-busy={isSubmitting}
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            maxWidth: 400,
            width: '90%',
            textAlign: 'center'
          }}
        >
          <h2 id={titleId}>Did you complete this?</h2>
          <p id={descriptionId} style={{ fontSize: 18, margin: '16px 0' }}>
            <strong>{questTitle}</strong>
          </p>
          <p style={{ margin: '16px 0' }}>
            For completing this task, you'll earn <strong>{points} points</strong>.
          </p>
          <p id={helperTextId} style={{ margin: '16px 0', fontSize: 14, opacity: 0.8 }}>
            Your parent will need to approve this request before the points are added to your account.
          </p>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: 8,
                background: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: 8,
                background: '#0ea5e9',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default QuestCompletionModal;
