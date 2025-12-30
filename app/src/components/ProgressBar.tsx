import React from 'react';
import { motion } from 'framer-motion';

type ProgressBarProps = {
  current: number;
  max: number;
  label?: string;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 4,
          fontSize: 14
        }}>
          <span>{label}</span>
          <span>{current} / {max}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.max(0, Math.min(current, max))}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{
          height: 12,
          borderRadius: 6,
          backgroundColor: '#334155', // Darker background for better visibility in dark mode
          border: '1px solid #475569', // Added border for better contrast
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            height: '100%',
            backgroundColor: '#0ea5e9',
            borderRadius: 6
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
