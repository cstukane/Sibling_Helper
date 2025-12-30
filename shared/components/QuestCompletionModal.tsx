import React, { useState } from 'react';

type QuestCompletionModalProps = {
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

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 12,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center'
        }}
      >
        <h2>Did you complete this?</h2>
        <p style={{ fontSize: 18, margin: '16px 0' }}>
          <strong>{questTitle}</strong>
        </p>
        <p style={{ margin: '16px 0' }}>
          For completing this task, you'll earn <strong>{points} points</strong>.
        </p>
        <p style={{ margin: '16px 0', fontSize: 14, opacity: 0.8 }}>
          Your parent will need to approve this request before the points are added to your account.
        </p>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
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
  );
};

export default QuestCompletionModal;