import React, { useState, useEffect, useId } from 'react';
import type { Reward } from '@state/rewards';
import { sanitizeNumber, sanitizeOptionalText, sanitizeText } from '../utils/sanitize';

type RewardFormProps = {
  reward?: Reward;
  onSave: (reward: Omit<Reward, 'id'>) => void;
  onCancel: () => void;
};

const RewardForm: React.FC<RewardFormProps> = ({ reward, onSave, onCancel }) => {
  const fieldId = useId();
  const [title, setTitle] = useState(reward?.title || '');
  const [description, setDescription] = useState(reward?.description || '');
  const [cost, setCost] = useState(reward?.cost.toString() || '1');
  const [active, setActive] = useState(reward?.active !== false);
  const [errors, setErrors] = useState<{ title?: string; cost?: string }>({});

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
    const nextErrors: { title?: string; cost?: string } = {};
    const safeTitle = sanitizeText(title, 80);
    if (!safeTitle) {
      nextErrors.title = 'Title is required.';
    }
    const numericCost = Number(cost);
    if (!Number.isFinite(numericCost) || numericCost < 1) {
      nextErrors.cost = 'Cost must be 1 or more.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
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
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-title`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Reward Title
        </label>
        <input
          id={`${fieldId}-title`}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) {
              setErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
          required
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? `${fieldId}-title-error` : undefined}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: 8,
            border: errors.title ? '1px solid #ef4444' : '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
        {errors.title && (
          <div id={`${fieldId}-title-error`} style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.title}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-description`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Description (Optional)
        </label>
        <textarea
          id={`${fieldId}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            minHeight: 60,
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-cost`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Point Cost
        </label>
        <input
          id={`${fieldId}-cost`}
          type="number"
          min="1"
          value={cost}
          onChange={(e) => {
            setCost(e.target.value);
            if (errors.cost) {
              setErrors((prev) => ({ ...prev, cost: undefined }));
            }
          }}
          required
          aria-invalid={errors.cost ? true : undefined}
          aria-describedby={errors.cost ? `${fieldId}-cost-error` : undefined}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: 8,
            border: errors.cost ? '1px solid #ef4444' : '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
        {errors.cost && (
          <div id={`${fieldId}-cost-error`} style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.cost}
          </div>
        )}
        {Number.isFinite(Number(cost)) && Number(cost) > 10000 && !errors.cost && (
          <div style={{ color: '#b45309', fontSize: 12, marginTop: 4 }}>
            Max is 10,000 points. This will be capped when saved.
          </div>
        )}
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
