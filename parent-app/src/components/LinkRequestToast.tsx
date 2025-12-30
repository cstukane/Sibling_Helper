import React from 'react';

type LinkRequestToastProps = {
  childId: string;
  onApprove: () => void;
  onDecline: () => void;
  onClose?: () => void;
  isDarkMode?: boolean;
};

const LinkRequestToast: React.FC<LinkRequestToastProps> = ({ childId, onApprove, onDecline, onClose, isDarkMode }) => {
  const bg = isDarkMode ? '#0f172a' : 'white';
  const fg = isDarkMode ? '#f8fafc' : '#111827';
  const border = isDarkMode ? '#334155' : '#e5e7eb';
  const shadow = isDarkMode ? '0 8px 16px rgba(0,0,0,0.5)' : '0 8px 16px rgba(0,0,0,0.15)';
  const muted = isDarkMode ? '#94a3b8' : '#374151';
  const closeColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const declineBorder = '#ef4444';
  const approveBorder = '#16a34a';
  const approveBg = '#16a34a';
  const approveFg = 'white';
  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-label="New link request"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 2000,
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: 8,
        boxShadow: shadow,
        padding: 16,
        width: 320,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>New link request</div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: closeColor }}
        >
          ×
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: muted }}>
        Child device requesting link.
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: closeColor }}>childId: {childId}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={onDecline}
          style={{ padding: '8px 12px', border: `1px solid ${declineBorder}`, color: '#ef4444', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}
        >
          Decline
        </button>
        <button
          onClick={onApprove}
          style={{ padding: '8px 12px', border: `1px solid ${approveBorder}`, color: approveFg, background: approveBg, borderRadius: 6, cursor: 'pointer' }}
        >
          Approve
        </button>
      </div>
    </div>
  );
};

export default LinkRequestToast;
