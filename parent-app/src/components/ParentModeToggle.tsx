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

  const handlePinEntered = async (pin: string) => {
    await pinManager.initializeDefaultPin();
    if (await pinManager.validatePin(pin)) {
      const newMode = !isParentMode;
      setIsParentMode(newMode);
      onParentModeChange(newMode);
      setShowPinPad(false);
    } else {
      setShowPinPad(false);
    }
  };

  const handleCancel = () => {
    setShowPinPad(false);
  };

  const toggleParentMode = async () => {
    if (isParentMode) {
      setIsParentMode(false);
      onParentModeChange(false);
    } else {
      await pinManager.initializeDefaultPin();
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
