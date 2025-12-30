import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

type Props = { 
  title: string; 
  points: number;
  completed?: boolean;
  onComplete?: () => void;
};

const QuestCard = ({ title, points, completed = false, onComplete }: Props) => {
  const [isCompleted, setIsCompleted] = useState(completed);
  
  const triggerConfetti = () => {
    const end = Date.now() + 200;
    
    const frame = () => {
      // Simple confetti effect using canvas-confetti
      // In a real implementation, this would use the actual confetti library
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };
  
  const handleClick = () => {
    if (!isCompleted && onComplete) {
      setIsCompleted(true);
      onComplete();
      triggerConfetti();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
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
        background: isCompleted ? '#f0fdf4' : '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        cursor: isCompleted ? 'default' : 'pointer',
        width: '100%',
        minHeight: 80, // Ensure large tap target
        fontSize: '1rem' // Ensure readable text
      }}
      aria-label={isCompleted ? `Completed quest ${title}` : `Complete quest ${title}`}
      disabled={isCompleted}
      tabIndex={0}
    >
      {isCompleted && (
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
      
      {isCompleted && (
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
          Completed!
        </motion.div>
      )}
    </motion.button>
  );
};

export default QuestCard;
