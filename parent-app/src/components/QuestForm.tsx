import React, { useState, useEffect, useId } from 'react';
import type { Quest } from '@state/questTypes';
import { sanitizeNumber, sanitizeOptionalText, sanitizeText } from '../utils/sanitize';

type QuestFormProps = {
  quest?: Quest;
  onSave: (quest: Omit<Quest, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
};

type RecurrenceType = NonNullable<Quest['recurrence']>['type'];

const QuestForm: React.FC<QuestFormProps> = ({ quest, onSave, onCancel }) => {
  const fieldId = useId();
  const [title, setTitle] = useState(quest?.title || '');
  const [description, setDescription] = useState(quest?.description || '');
  const [category, setCategory] = useState<Quest['category']>(quest?.category || undefined);
  const [points, setPoints] = useState(quest?.points.toString() || '1');
  const [active, setActive] = useState(quest?.active !== false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(quest?.recurrence?.type || 'none');
  const [errors, setErrors] = useState<{ title?: string; points?: string }>({});

  useEffect(() => {
    if (quest) {
      setTitle(quest.title);
      setDescription(quest.description || '');
      setCategory(quest.category);
      setPoints(quest.points.toString());
      setActive(quest.active);
      setRecurrenceType(quest.recurrence?.type || 'none');
    }
  }, [quest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recurrence = recurrenceType === 'none' ? undefined : { type: recurrenceType };
    const nextErrors: { title?: string; points?: string } = {};
    const safeTitle = sanitizeText(title, 80);
    if (!safeTitle) {
      nextErrors.title = 'Title is required.';
    }
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints < 1) {
      nextErrors.points = 'Points must be 1 or more.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const safeDescription = sanitizeOptionalText(description, 240);
    const safePoints = sanitizeNumber(points, 1, 10, 1);

    onSave({
      title: safeTitle,
      description: safeDescription || null,
      category,
      points: safePoints,
      active,
      recurrence
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-title`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Title
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
        <label htmlFor={`${fieldId}-category`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Category (Optional)
        </label>
        <select
          id={`${fieldId}-category`}
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4
          }}
        >
          <option value="">None</option>
          <option value="helping">Helping</option>
          <option value="quiet">Quiet Time</option>
          <option value="kindness">Kindness</option>
          <option value="custom">Custom</option>
          <option value="chores">Chores</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-points`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Points
        </label>
        <input
          id={`${fieldId}-points`}
          type="number"
          value={points}
          onChange={(e) => {
            setPoints(e.target.value);
            if (errors.points) {
              setErrors((prev) => ({ ...prev, points: undefined }));
            }
          }}
          min="1"
          max="10"
          required
          aria-invalid={errors.points ? true : undefined}
          aria-describedby={errors.points ? `${fieldId}-points-error` : undefined}
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: 8,
            border: errors.points ? '1px solid #ef4444' : '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
        {errors.points && (
          <div id={`${fieldId}-points-error`} style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {errors.points}
          </div>
        )}
        {Number.isFinite(Number(points)) && Number(points) > 10 && !errors.points && (
          <div style={{ color: '#b45309', fontSize: 12, marginTop: 4 }}>
            Max is 10 points. This will be capped when saved.
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor={`${fieldId}-recurrence`} style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
          Recurrence (Optional)
        </label>
        <select
          id={`${fieldId}-recurrence`}
          value={recurrenceType}
          onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4
          }}
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label htmlFor={`${fieldId}-active`} style={{ display: 'flex', alignItems: 'center' }}>
          <input
            id={`${fieldId}-active`}
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
          {quest ? 'Save' : 'Save'}
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
