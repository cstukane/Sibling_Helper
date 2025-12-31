import Dexie, { type EntityTable } from 'dexie';
import type { Hero } from '@state/heroTypes';
import type { Quest } from '@state/questTypes';
import type { DailyBoardItem } from '@state/boardTypes';
import type { Reward } from '@state/rewardTypes';
import type { Redemption } from '@state/redemptionTypes';

interface DatabaseSchema {
  heroes: Hero;
  quests: Quest;
  board: DailyBoardItem;
  rewards: Reward;
  redemptions: Redemption;
}

class SiblingHelperDB extends Dexie {
  heroes!: EntityTable<Hero, 'id'>;
  quests!: EntityTable<Quest, 'id'>;
  board!: EntityTable<DailyBoardItem, 'id'>;
  rewards!: EntityTable<Reward, 'id'>;
  redemptions!: EntityTable<Redemption, 'id'>;

  constructor() {
    super('SiblingHelperDB');
    this.version(1).stores({
      heroes: 'id, name, points, streakDays, createdAt, updatedAt',
      quests: 'id, title, category, points, active, createdAt, updatedAt',
      board: 'id, questId, date, heroId, completedAt',
      rewards: 'id, title, cost, active',
      redemptions: 'id, heroId, rewardId, pointsSpent, redeemedAt'
    });
    this.version(2).stores({
      heroes: 'id, name, points, streakDays, createdAt, updatedAt',
      quests: 'id, title, category, points, active, createdAt, updatedAt, [category+active]',
      board: 'id, questId, date, heroId, completedAt, [heroId+date]',
      rewards: 'id, title, cost, active',
      redemptions: 'id, heroId, rewardId, pointsSpent, redeemedAt'
    });
  }
}

const db = new SiblingHelperDB();

export type { DatabaseSchema };
export { db };
