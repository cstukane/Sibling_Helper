import React from 'react';
import { motion } from 'framer-motion';

type Props = { 
  title: string; 
  points: number;
  completed?: boolean;
  onComplete?: () => void;
};

const QuestCard: React.FC<Props> = ({ title, points, completed = false, onComplete }) => {
  const handleClick = () => {
    if (!completed && onComplete) {
      onComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{
        textAlign: 'left',
        padding: 12,
        borderRadius: 12,
        border: '1px solid #ddd',
        background: completed ? '#f0fdf4' : '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        cursor: completed ? 'default' : 'pointer',
        width: '100%',
        minHeight: 80, // Ensure large tap target
        fontSize: '1rem' // Ensure readable text
      }}
      aria-label={completed ? `Completed quest ${title}` : `Request points for ${title}`}
      disabled={completed}
      tabIndex={0}
    >
      {completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            background: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-hidden="true"
        >
          <span style={{ color: 'white', fontSize: 12 }}>✓</span>
        </motion.div>
      )}
      
      <strong>{title}</strong>
      <div style={{ opacity: 0.8, marginTop: 4 }}>+{points} pts</div>
      
      {!completed && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          fontSize: 10,
          color: '#0ea5e9',
          fontStyle: 'italic'
        }}>
          Tap to request
        </div>
      )}
      
      {completed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            fontSize: 12,
            color: '#10b981'
          }}
        >
          Requested!
        </motion.div>
      )}
    </motion.button>
  );
};

export default QuestCard;