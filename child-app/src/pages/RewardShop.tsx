import React, { useState } from 'react';
import { useHero } from '@state/hero';
import { useRewards } from '@state/rewards';
import { useRedemptions } from '@state/redemptions';
import RewardCard from '@components/RewardCard';
import PinPad from '@components/PinPad';
import { pinManager } from '@state/pinManager';
import { LoadingIndicator } from '@sibling-helper/shared';

const RewardShop: React.FC = () => {
  const { hero, loading: heroLoading, error: heroError, refreshHero } = useHero();
  const { rewards, loading: rewardsLoading, error: rewardsError, refreshRewards } = useRewards();
  const {
    redeemReward,
    loading: redemptionsLoading,
    error: redemptionsError,
    refreshRedemptions
  } = useRedemptions(hero?.id || '');
  const [showPinPad, setShowPinPad] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const errorMessages = [heroError, rewardsError, redemptionsError].filter(Boolean) as string[];
  const isLoading = heroLoading || rewardsLoading || redemptionsLoading;

  const handleRetry = async () => {
    await refreshHero();
    await refreshRewards();
    if (hero?.id) {
      await refreshRedemptions(hero.id);
    }
  };

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

  const handlePinEntered = async (pin: string) => {
    await pinManager.initializeDefaultPin();
    if (selectedReward && hero && await pinManager.validatePin(pin)) {
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

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <LoadingIndicator label="Loading reward shop..." />
      </div>
    );
  }

  if (!hero) {
    return (
      <section>
        <div role="alert" style={{ 
          border: '1px solid var(--state-error)',
          backgroundColor: 'var(--bg-surface-overlay)',
          color: 'var(--state-error)',
          padding: 12,
          borderRadius: 8
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Unable to load profile</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Try again, and if this keeps happening consider refreshing the app.
          </div>
          {errorMessages.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {errorMessages.map((message, index) => (
                <div key={`${message}-${index}`}>{message}</div>
              ))}
            </div>
          )}
          <button
            onClick={handleRetry}
            className="themed-button primary"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontWeight: 'bold'
            }}
          >
            Retry loading
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {errorMessages.length > 0 && (
        <div role="alert" style={{ 
          border: '1px solid var(--state-error)',
          backgroundColor: 'var(--bg-surface-overlay)',
          color: 'var(--state-error)',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>We ran into a data error</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Try again, and if this keeps happening consider refreshing the app.
          </div>
          <div style={{ marginBottom: 12 }}>
            {errorMessages.map((message, index) => (
              <div key={`${message}-${index}`}>{message}</div>
            ))}
          </div>
          <button
            onClick={handleRetry}
            className="themed-button primary"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontWeight: 'bold'
            }}
          >
            Retry loading
          </button>
        </div>
      )}
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
