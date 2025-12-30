import type { Quest } from '@state/questTypes';

/**
 * Determines if a quest is a chore based on its recurrence pattern (aligns with parent app logic)
 * @param quest The quest to check
 * @returns true if the quest is a chore, false otherwise
 */
export const isChore = (quest: Quest): boolean => {
  return quest.recurrence !== null && quest.recurrence !== undefined;
};

/**
 * Determines if a quest is a one-time quest (not a chore) (aligns with parent app logic)
 * @param quest The quest to check
 * @returns true if the quest is a one-time quest, false otherwise
 */
export const isQuest = (quest: Quest): boolean => {
  return !quest.recurrence || quest.recurrence === null;
};

/**
 * Determines the type of a quest (aligns with parent app logic)
 * @param quest The quest to check
 * @returns 'chore' if the quest is a chore, 'quest' otherwise
 */
export const getQuestType = (quest: Quest): 'quest' | 'chore' => {
  return isChore(quest) ? 'chore' : 'quest';
};