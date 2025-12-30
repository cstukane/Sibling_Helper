import { describe, it, expect } from 'vitest';
import type { Quest } from '../state/questTypes';

// Helper function to determine task type based on recurrence
const taskType = (quest: Quest): 'quest' | 'chore' => {
  return quest.recurrence && quest.recurrence.type !== 'none' ? 'chore' : 'quest';
};

describe('Task Recurrence Logic', () => {
  it('should classify tasks with no recurrence as quests', () => {
    const quest: Quest = {
      id: '1',
      title: 'Help with dishes',
      points: 10,
      active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('quest');
  });

  it('should classify tasks with "none" recurrence as quests', () => {
    const quest: Quest = {
      id: '1',
      title: 'Help with dishes',
      points: 10,
      active: true,
      recurrence: { type: 'none' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('quest');
  });

  it('should classify tasks with daily recurrence as chores', () => {
    const quest: Quest = {
      id: '1',
      title: 'Make bed',
      points: 5,
      active: true,
      recurrence: { type: 'daily' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('chore');
  });

  it('should classify tasks with weekly recurrence as chores', () => {
    const quest: Quest = {
      id: '1',
      title: 'Clean room',
      points: 15,
      active: true,
      recurrence: { type: 'weekly' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('chore');
  });

  it('should classify tasks with monthly recurrence as chores', () => {
    const quest: Quest = {
      id: '1',
      title: 'Water plants',
      points: 20,
      active: true,
      recurrence: { type: 'monthly' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('chore');
  });

  it('should classify tasks with custom recurrence as chores', () => {
    const quest: Quest = {
      id: '1',
      title: 'Special task',
      points: 25,
      active: true,
      recurrence: { type: 'custom', rule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    expect(taskType(quest)).toBe('chore');
  });
});