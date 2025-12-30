import React, { useState, useEffect } from 'react';
import type { Quest } from '@state/questTypes';

type QuestFormProps = {
  quest?: Quest;
  onSave: (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isChore?: boolean;
};

const QuestForm: React.FC<QuestFormProps> = ({ quest, onSave, onCancel, isChore = false }) => {
  const [title, setTitle] = useState(quest?.title || '');
  const [description, setDescription] = useState(quest?.description || '');
  const [category, setCategory] = useState<Quest['category']>(quest?.category || (isChore ? 'chores' : 'helping'));
  const [points, setPoints] = useState(quest?.points.toString() || '1');
  const [active, setActive] = useState(quest?.active !== false);
  const [recurrence, setRecurrence] = useState<Quest['recurrence']>(quest?.recurrence || null);

  useEffect(() => {
    if (quest) {
      setTitle(quest.title);
      setDescription(quest.description || '');
      setCategory(quest.category);
      setPoints(quest.points.toString());
      setActive(quest.active);
      setRecurrence(quest.recurrence || null);
    } else if (isChore) {
      setCategory('chores');
    }
  }, [quest, isChore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description || null,
      category: isChore ? 'chores' : category,
      points: parseInt(points) || 1,
      active,
      recurrence: isChore ? recurrence : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          {isChore ? 'Chore Title' : 'Quest Title'}
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

      {!isChore && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Quest['category'])}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          >
            <option value="helping">Helping</option>
            <option value="quiet">Quiet Time</option>
            <option value="kindness">Kindness</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      )}

      {isChore && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            Recurrence
          </label>
          <select
            value={recurrence || ''}
            onChange={(e) => setRecurrence(e.target.value as Quest['recurrence'] || null)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          >
            <option value="">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          
          <div style={{ 
            marginTop: 8, 
            padding: 12, 
            backgroundColor: '#f0f9ff', 
            borderRadius: 8, 
            border: '1px solid #bae6fd'
          }}>
            <h4>Recurring Chores</h4>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              Recurring chores automatically appear on the daily board based on their schedule.
            </p>
            <p style={{ margin: '8px 0', fontSize: 14 }}>
              One-time chores only appear once until manually added again.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Points
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
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
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {quest ? (isChore ? 'Update Chore' : 'Update Quest') : (isChore ? 'Add Chore' : 'Add Quest')}
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

export default QuestForm;