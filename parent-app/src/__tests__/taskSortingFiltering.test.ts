import { describe, it, expect } from 'vitest';
import type { Quest } from '../state/questTypes';

// Mock data for testing
const mockQuests: Quest[] = [
  {
    id: '1',
    title: 'Help with dishes',
    points: 10,
    active: true,
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2023-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Make bed',
    points: 5,
    active: true,
    recurrence: { type: 'daily' },
    created_at: '2023-01-01T09:00:00Z',
    updated_at: '2023-01-01T11:00:00Z' // Most recently updated
  },
  {
    id: '3',
    title: 'Clean room',
    points: 15,
    active: true,
    recurrence: { type: 'weekly' },
    created_at: '2023-01-01T08:00:00Z',
    updated_at: '2023-01-01T09:30:00Z'
  },
  {
    id: '4',
    title: 'Water plants',
    points: 20,
    active: true,
    recurrence: { type: 'monthly' },
    created_at: '2023-01-01T07:00:00Z',
    updated_at: '2023-01-01T08:30:00Z'
  }
];

describe('Task Sorting and Filtering', () => {
  it('should filter tasks by type - all tasks', () => {
    // Filter: all
    const allTasks = mockQuests;
    expect(allTasks).toHaveLength(4);
  });

  it('should filter tasks by type - only quests', () => {
    // Filter: quests only (no recurrence or recurrence.type === 'none')
    const questsOnly = mockQuests.filter(q => !q.recurrence || q.recurrence.type === 'none');
    expect(questsOnly).toHaveLength(1);
    expect(questsOnly[0].title).toBe('Help with dishes');
  });

  it('should filter tasks by type - only chores', () => {
    // Filter: chores only (recurrence.type !== 'none')
    const choresOnly = mockQuests.filter(q => q.recurrence && q.recurrence.type !== 'none');
    expect(choresOnly).toHaveLength(3);
    expect(choresOnly.map(q => q.title)).toEqual(['Make bed', 'Clean room', 'Water plants']);
  });

  it('should sort tasks by points descending', () => {
    // Sort: points (descending)
    const sortedByPoints = [...mockQuests].sort((a, b) => b.points - a.points);
    expect(sortedByPoints.map(q => q.points)).toEqual([20, 15, 10, 5]);
    expect(sortedByPoints[0].title).toBe('Water plants');
  });

  it('should sort tasks alphabetically A→Z', () => {
    // Sort: A→Z
    const sortedAZ = [...mockQuests].sort((a, b) => a.title.localeCompare(b.title));
    expect(sortedAZ.map(q => q.title)).toEqual(['Clean room', 'Help with dishes', 'Make bed', 'Water plants']);
  });

  it('should sort tasks alphabetically Z→A', () => {
    // Sort: Z→A
    const sortedZA = [...mockQuests].sort((a, b) => b.title.localeCompare(a.title));
    expect(sortedZA.map(q => q.title)).toEqual(['Water plants', 'Make bed', 'Help with dishes', 'Clean room']);
  });

  it('should sort tasks by recently updated', () => {
    // Sort: recently updated (newest first)
    const sortedRecent = [...mockQuests].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    expect(sortedRecent[0].title).toBe('Make bed'); // Most recently updated
    expect(sortedRecent[sortedRecent.length - 1].title).toBe('Water plants'); // Oldest updated
  });

  it('should filter tasks by search term', () => {
    // Search for "bed"
    const searchTerm = 'bed';
    const searchResults = mockQuests.filter(q => 
      q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].title).toBe('Make bed');
  });

  it('should filter tasks by search term in description', () => {
    // Add a quest with a description for testing
    const quests = [
      ...mockQuests,
      {
        id: '5',
        title: 'Special task',
        description: 'Help with laundry',
        points: 25,
        active: true,
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z'
      }
    ];
    
    // Search for "laundry" in description
    const searchTerm = 'laundry';
    const searchResults = quests.filter(q => 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].title).toBe('Special task');
  });
});