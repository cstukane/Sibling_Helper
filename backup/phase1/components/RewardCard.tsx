import React from 'react';
import { motion } from 'framer-motion';

type RewardCardProps = {
  title: string;
  cost: number;
  description: string;
  canAfford: boolean;
  onRedeem: () => void;
};

const RewardCard: React.FC<RewardCardProps> = ({ title, cost, description, canAfford, onRedeem }) => {
  return (
    <motion.div
      whileHover={{ scale: canAfford ? 1.03 : 1 }}
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px solid #ddd',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        opacity: canAfford ? 1 : 0.6,
        cursor: canAfford ? 'pointer' : 'not-allowed'
      }}
      onClick={canAfford ? onRedeem : undefined}
    >
      <div style={{ 
        position: 'absolute', 
        top: -10, 
        right: 12, 
        background: '#0ea5e9', 
        color: 'white', 
        borderRadius: 12, 
        padding: '4px 12px', 
        fontWeight: 'bold' 
      }}>
        {cost} pts
      </div>
      
      <h3 style={{ marginTop: 8, marginBottom: 8 }}>{title}</h3>
      <p style={{ opacity: 0.8, fontSize: 14, minHeight: 40 }}>{description}</p>
      
      <button
        disabled={!canAfford}
        style={{
          width: '100%',
          padding: 8,
          background: canAfford ? '#0ea5e9' : '#e5e7eb',
          color: canAfford ? 'white' : '#9ca3af',
          border: 'none',
          borderRadius: 6,
          cursor: canAfford ? 'pointer' : 'not-allowed',
          fontWeight: 'bold'
        }}
      >
        {canAfford ? 'Redeem' : 'Not enough points'}
      </button>
    </motion.div>
  );
};

export default RewardCard;