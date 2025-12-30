import type { Quest } from '@state/questTypes';

/**
 * Determines if a quest is a chore based on its recurrence
 * @param quest The quest to check
 * @returns true if the quest is a chore, false otherwise
 */
export const isChore = (quest: Quest): boolean => {
  return Boolean(quest.recurrence && quest.recurrence.type !== 'none');
};

/**
 * Determines if a quest is a one-time quest (not a chore)
 * @param quest The quest to check
 * @returns true if the quest is a one-time quest, false otherwise
 */
export const isQuest = (quest: Quest): boolean => {
  return !quest.recurrence || quest.recurrence.type === 'none';
};

/**
 * Determines the type of a quest
 * @param quest The quest to check
 * @returns 'chore' if the quest is a chore, 'quest' otherwise
 */
export const getQuestType = (quest: Quest): 'quest' | 'chore' => {
  return isChore(quest) ? 'chore' : 'quest';
};
