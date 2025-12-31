import React, { useState, useEffect } from 'react';
import type { Reward } from '@state/rewards';
import { sanitizeNumber, sanitizeOptionalText, sanitizeText } from '../utils/sanitize';

type RewardFormProps = {
  reward?: Reward;
  onSave: (reward: Omit<Reward, 'id'>) => void;
  onCancel: () => void;
};

const RewardForm: React.FC<RewardFormProps> = ({ reward, onSave, onCancel }) => {
  const [title, setTitle] = useState(reward?.title || '');
  const [description, setDescription] = useState(reward?.description || '');
  const [cost, setCost] = useState(reward?.cost.toString() || '1');
  const [active, setActive] = useState(reward?.active !== false);

  useEffect(() => {
    if (reward) {
      setTitle(reward.title);
      setDescription(reward.description || '');
      setCost(reward.cost.toString());
      setActive(reward.active);
    }
  }, [reward]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = sanitizeText(title, 80);
    if (!safeTitle) return;
    const safeDescription = sanitizeOptionalText(description, 240);
    const safeCost = sanitizeNumber(cost, 1, 10000, 1);
    onSave({
      title: safeTitle,
      description: safeDescription || null,
      cost: safeCost,
      active
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Reward Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            minHeight: 60
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Point Cost
        </label>
        <input
          type="number"
          min="1"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4
          }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Active
        </label>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {reward ? 'Update Reward' : 'Add Reward'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            background: 'white',
            color: '#374151',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RewardForm;
