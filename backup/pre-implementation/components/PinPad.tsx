import React, { useState } from 'react';
import { motion } from 'framer-motion';

type PinPadProps = {
  onPinEntered: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
};

const PinPad: React.FC<PinPadProps> = ({ onPinEntered, onCancel, title = 'Enter Parent PIN' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-submit when we have 4 digits
      if (newPin.length === 4) {
        setTimeout(() => {
          onPinEntered(newPin);
        }, 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      onPinEntered(pin);
    } else {
      setError('PIN must be 4 digits');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, num?: string) => {
    // Allow keyboard navigation
    if (e.key === 'Enter') {
      if (num) {
        handleNumberClick(num);
      } else if (pin.length === 4) {
        onPinEntered(pin);
      }
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key >= '0' && e.key <= '9' && pin.length < 4) {
      handleNumberClick(e.key);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      role="dialog"
      aria-labelledby="pin-pad-title"
      aria-modal="true"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          width: '90%',
          maxWidth: 320
        }}
      >
        <h2 id="pin-pad-title" style={{ textAlign: 'center', margin: '0 0 24px 0' }}>{title}</h2>
        
        <form onSubmit={handleSubmit}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 12, 
              marginBottom: 24 
            }}
            aria-label="PIN display"
          >
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  border: '2px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 'bold'
                }}
                aria-label={`Digit ${index + 1}`}
              >
                {pin[index] ? '*' : ''}
              </div>
            ))}
          </div>
          
          {error && (
            <div 
              style={{ 
                color: '#ef4444', 
                textAlign: 'center', 
                marginBottom: 16 
              }}
              role="alert"
            >
              {error}
            </div>
          )}
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNumberClick(num.toString())}
                onKeyDown={(e) => handleKeyDown(e, num.toString())}
                style={{
                  height: 60,
                  fontSize: 24,
                  fontWeight: 'bold',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  background: 'white'
                }}
                aria-label={`Number ${num}`}
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              onKeyDown={(e) => handleKeyDown(e)}
              style={{
                height: 60,
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                background: 'white'
              }}
              aria-label="Cancel"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNumberClick('0')}
              onKeyDown={(e) => handleKeyDown(e, '0')}
              style={{
                height: 60,
                fontSize: 24,
                fontWeight: 'bold',
                border: '1px solid #ddd',
                borderRadius: 8,
                background: 'white'
              }}
              aria-label="Number 0"
            >
              0
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleBackspace}
              onKeyDown={(e) => handleKeyDown(e)}
              style={{
                height: 60,
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: 8,
                background: 'white'
              }}
              aria-label="Backspace"
            >
              ←
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PinPad;