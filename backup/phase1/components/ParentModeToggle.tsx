import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PinPad from '@components/PinPad';
import { pinManager } from '@state/pinManager';

type ParentModeToggleProps = {
  onParentModeChange: (isParentMode: boolean) => void;
};

const ParentModeToggle: React.FC<ParentModeToggleProps> = ({ onParentModeChange }) => {
  const [showPinPad, setShowPinPad] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);

  const handlePinEntered = (pin: string) => {
    console.log('PIN entered:', pin);
    
    // Initialize default PIN if not set
    pinManager.initializeDefaultPin();
    
    // Check if PIN is set
    const isSet = pinManager.isPinSet();
    console.log('PIN is set:', isSet);
    
    // Get stored PIN
    const storedPin = localStorage.getItem('parent_pin');
    console.log('Stored PIN:', storedPin);
    
    if (pinManager.validatePin(pin)) {
      console.log('PIN validation successful');
      const newMode = !isParentMode;
      setIsParentMode(newMode);
      onParentModeChange(newMode);
      setShowPinPad(false);
    } else {
      console.log('PIN validation failed');
      // In a real app, we might want to show an error or limit attempts
      setShowPinPad(false);
    }
  };

  const handleCancel = () => {
    setShowPinPad(false);
  };

  const toggleParentMode = () => {
    if (isParentMode) {
      // Exit parent mode directly
      console.log('Exiting parent mode');
      setIsParentMode(false);
      onParentModeChange(false);
    } else {
      // Enter parent mode requires PIN
      console.log('Entering parent mode - showing PIN pad');
      pinManager.initializeDefaultPin(); // Ensure a PIN exists
      setShowPinPad(true);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={toggleParentMode}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          border: 'none',
          background: isParentMode ? '#0ea5e9' : '#e5e7eb',
          color: isParentMode ? 'white' : '#374151',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12
        }}
        aria-label={isParentMode ? 'Exit Parent Mode' : 'Enter Parent Mode'}
      >
        {isParentMode ? 'Kid' : 'P'}
      </motion.button>

      {showPinPad && (
        <PinPad 
          onPinEntered={handlePinEntered} 
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default ParentModeToggle;