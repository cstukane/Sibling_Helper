import React, { useState } from 'react';
import { useHero } from '@state/hero';
import { useRewards } from '@state/rewards';
import { useRedemptions } from '@state/redemptions';
import RewardCard from '@components/RewardCard';
import PinPad from '@components/PinPad';

const RewardShop: React.FC = () => {
  const { hero } = useHero();
  const { rewards } = useRewards();
  const { redeemReward } = useRedemptions(hero?.id || '');
  const [showPinPad, setShowPinPad] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  const handleRedeem = (rewardId: string, cost: number) => {
    if (!hero) return;
    
    // Check if hero has enough reward points
    if (hero.rewardPoints < cost) {
      alert('Not enough reward points!');
      return;
    }
    
    setSelectedReward(rewardId);
    setShowPinPad(true);
  };

  const handlePinEntered = (pin: string) => {
    // In a real app, we would validate the PIN properly
    // For now, we'll just check if it's the default
    if (pin === '1234' && selectedReward && hero) {
      const reward = rewards.find(r => r.id === selectedReward);
      if (reward) {
        redeemReward(hero.id, reward.id, reward.cost);
        setShowPinPad(false);
        setSelectedReward(null);
        alert(`Redeemed: ${reward.title}!`);
      }
    } else {
      alert('Invalid PIN');
      setShowPinPad(false);
      setSelectedReward(null);
    }
  };

  const handleCancel = () => {
    setShowPinPad(false);
    setSelectedReward(null);
  };

  if (!hero) {
    return <div>Loading...</div>;
  }

  return (
    <section>
      <header style={{ marginBottom: 24 }}>
        <h1>Reward Shop</h1>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>
          Your Reward Points: {hero.rewardPoints}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
          Progression Points: {hero.progressionPoints} (Levels: {Math.floor((hero.progressionPoints || 0) / 10)})
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {rewards.map(reward => (
          <RewardCard
            key={reward.id}
            title={reward.title}
            cost={reward.cost}
            description={reward.description || ''}
            canAfford={hero.rewardPoints >= reward.cost}
            onRedeem={() => handleRedeem(reward.id, reward.cost)}
          />
        ))}
      </div>
      
      {showPinPad && (
        <PinPad 
          title="Enter Parent PIN to Redeem"
          onPinEntered={handlePinEntered}
          onCancel={handleCancel}
        />
      )}
    </section>
  );
};

export default RewardShop;