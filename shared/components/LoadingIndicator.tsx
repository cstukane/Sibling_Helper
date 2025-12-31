import React from 'react';

type LoadingIndicatorProps = {
  label?: string;
  size?: number;
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ label = 'Loading...', size = 24 }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'inherit'
      }}
    >
      <div
        className="loading-indicator__spinner"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '3px solid rgba(148, 163, 184, 0.35)',
          borderTopColor: 'rgba(14, 165, 233, 0.9)',
          animation: 'loading-indicator-spin 0.9s linear infinite'
        }}
      />
      <span>{label}</span>
      <style>
        {`
          @keyframes loading-indicator-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .loading-indicator__spinner {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingIndicator;
